import logging
import datetime
from typing import Optional, Tuple, Dict, Any, List
import httpx

from app.schemas.weather import WeatherDay, WeatherResult

logger = logging.getLogger(__name__)

# Standard WMO Weather Code Mapping
WMO_CODE_MAP = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    62: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Light rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
}

class WeatherService:
    GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
    FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
    TIMEOUT_SECONDS = 8.0

    @classmethod
    async def geocode_destination(cls, destination: str) -> Tuple[Optional[float], Optional[float], Optional[str]]:
        """
        Geocodes a destination string into (latitude, longitude, resolved_name).
        Cleans location names (e.g. 'Tokyo, Japan' -> 'Tokyo').
        """
        clean_name = destination.split(",")[0].strip()
        if not clean_name:
            clean_name = destination.strip()

        try:
            async with httpx.AsyncClient(timeout=cls.TIMEOUT_SECONDS) as client:
                res = await client.get(
                    cls.GEOCODING_URL,
                    params={"name": clean_name, "count": 1, "language": "en", "format": "json"}
                )
                if res.status_code == 200:
                    data = res.json()
                    results = data.get("results")
                    if results and len(results) > 0:
                        top = results[0]
                        resolved = f"{top.get('name')}, {top.get('country', '')}".strip(", ")
                        return top.get("latitude"), top.get("longitude"), resolved
        except Exception as e:
            logger.warning(f"Geocoding failed for destination '{destination}': {e}")

        return None, None, None

    @classmethod
    async def get_weather_for_trip(
        cls, 
        destination: str, 
        departure_date: Optional[str] = None, 
        return_date: Optional[str] = None
    ) -> WeatherResult:
        """
        Retrieves real weather data for destination and requested dates using Open-Meteo.
        Respects honest date forecasting limits:
        - Within 16-day forecast horizon: returns real daily forecast data.
        - Outside 16-day horizon: returns forecast_available=False with honest disclaimer.
        - Error / Not found: returns safe graceful failure object.
        """
        lat, lon, resolved_name = await cls.geocode_destination(destination)
        loc_name = resolved_name or destination

        if lat is None or lon is None:
            return WeatherResult(
                location=destination,
                forecast_available=False,
                weather_days=[],
                source_status="location_not_found",
                planning_notes=f"Geographic coordinates for '{destination}' could not be resolved."
            )

        # Check date range against live forecast limit (16 days from today)
        today = datetime.date.today()
        max_forecast_date = today + datetime.timedelta(days=15)

        is_within_range = True
        dep_d = None
        ret_d = None

        if departure_date:
            try:
                dep_d = datetime.date.fromisoformat(departure_date)
                if dep_d > max_forecast_date or dep_d < today - datetime.timedelta(days=1):
                    is_within_range = False
            except ValueError:
                pass

        if return_date:
            try:
                ret_d = datetime.date.fromisoformat(return_date)
            except ValueError:
                pass

        if not is_within_range:
            return WeatherResult(
                location=loc_name,
                latitude=lat,
                longitude=lon,
                forecast_available=False,
                weather_days=[],
                source_status="out_of_range",
                planning_notes=f"Detailed weather forecast is not yet available for travel starting {departure_date}. Real-time forecast unlocks within 16 days of departure."
            )

        # Fetch real forecast
        try:
            params = {
                "latitude": lat,
                "longitude": lon,
                "daily": [
                    "weather_code",
                    "temperature_2m_max",
                    "temperature_2m_min",
                    "precipitation_sum",
                    "precipitation_probability_max",
                    "wind_speed_10m_max"
                ],
                "timezone": "auto",
                "forecast_days": 16
            }

            async with httpx.AsyncClient(timeout=cls.TIMEOUT_SECONDS) as client:
                res = await client.get(cls.FORECAST_URL, params=params)

                if res.status_code != 200:
                    logger.warning(f"Open-Meteo forecast API returned status {res.status_code}")
                    return WeatherResult(
                        location=loc_name,
                        latitude=lat,
                        longitude=lon,
                        forecast_available=False,
                        weather_days=[],
                        source_status="error",
                        planning_notes="Weather service temporarily unavailable."
                    )

                data = res.json()
                daily = data.get("daily", {})
                times = daily.get("time", [])
                w_codes = daily.get("weather_code", [])
                t_max = daily.get("temperature_2m_max", [])
                t_min = daily.get("temperature_2m_min", [])
                p_sum = daily.get("precipitation_sum", [])
                p_prob = daily.get("precipitation_probability_max", [])
                winds = daily.get("wind_speed_10m_max", [])

                weather_days: List[WeatherDay] = []
                for i in range(len(times)):
                    date_str = times[i]
                    # Filter for trip date range if specified
                    if dep_d and ret_d:
                        try:
                            cur_d = datetime.date.fromisoformat(date_str)
                            if cur_d < dep_d or cur_d > ret_d:
                                continue
                        except ValueError:
                            pass

                    code = w_codes[i] if i < len(w_codes) else None
                    condition_str = WMO_CODE_MAP.get(code, "Clear / Variable")

                    max_temp = float(t_max[i]) if i < len(t_max) and t_max[i] is not None else None
                    min_temp = float(t_min[i]) if i < len(t_min) and t_min[i] is not None else None
                    avg_temp = round((max_temp + min_temp) / 2.0, 1) if (max_temp is not None and min_temp is not None) else max_temp

                    weather_days.append(
                        WeatherDay(
                            date=date_str,
                            condition=condition_str,
                            temperature=avg_temp,
                            temperature_min=min_temp,
                            temperature_max=max_temp,
                            precipitation_probability=int(p_prob[i]) if i < len(p_prob) and p_prob[i] is not None else None,
                            precipitation_amount=float(p_sum[i]) if i < len(p_sum) and p_sum[i] is not None else None,
                            wind_speed=float(winds[i]) if i < len(winds) and winds[i] is not None else None,
                            weather_code=code
                        )
                    )

                if not weather_days:
                    return WeatherResult(
                        location=loc_name,
                        latitude=lat,
                        longitude=lon,
                        forecast_available=False,
                        weather_days=[],
                        source_status="out_of_range",
                        planning_notes="Forecast data not within requested travel dates."
                    )

                return WeatherResult(
                    location=loc_name,
                    latitude=lat,
                    longitude=lon,
                    forecast_available=True,
                    weather_days=weather_days,
                    source_status="live_forecast",
                    planning_notes=f"Live forecast retrieved for {len(weather_days)} travel day(s)."
                )

        except Exception as e:
            logger.error(f"Error retrieving forecast from Open-Meteo: {e}", exc_info=True)
            return WeatherResult(
                location=loc_name,
                latitude=lat,
                longitude=lon,
                forecast_available=False,
                weather_days=[],
                source_status="error",
                planning_notes="Weather service encountered a connection issue."
            )

weather_service = WeatherService()
