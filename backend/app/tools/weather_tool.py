import logging
from typing import Optional, Dict, Any, List
from langchain_core.prompts import ChatPromptTemplate

from app.schemas.weather import WeatherResult, WeatherInsight
from app.services.weather_service import weather_service
from app.services.llm_service import get_llm

logger = logging.getLogger(__name__)

WEATHER_INSIGHT_SYSTEM = """You are the TripMind AI Weather Intelligence Analyst.

Your role is to generate a concise, truthful, practical travel insight based ONLY on the provided REAL weather data.

CRITICAL DIRECTIVES:
1. DO NOT fabricate temperatures, weather conditions, or rain probabilities.
2. DO NOT contradict the provided real metrics.
3. If forecast_available is false, advise the traveler on general seasonal planning and keeping schedules flexible, without claiming specific temperatures.
4. Keep the summary under 2 sentences.
5. Provide 2-3 brief, actionable packing or activity recommendations directly aligned with the metrics."""

WEATHER_INSIGHT_HUMAN = """Generate a truthful travel weather insight for the following real weather data:

Location: {location}
Forecast Available: {forecast_available}
Status: {source_status}
Notes: {planning_notes}
Daily Weather Metrics:
{weather_days_text}

Travel Context:
{travel_context}

Return structured WeatherInsight:"""

class WeatherTool:
    @classmethod
    async def fetch_weather_for_trip(
        cls, 
        destination: str, 
        departure_date: Optional[str] = None, 
        return_date: Optional[str] = None
    ) -> WeatherResult:
        """Calls the trusted WeatherService to retrieve real weather data."""
        return await weather_service.get_weather_for_trip(
            destination=destination,
            departure_date=departure_date,
            return_date=return_date
        )

    @classmethod
    async def generate_insight(
        cls, 
        weather_result: WeatherResult, 
        travel_context: str = "Standard leisure trip"
    ) -> WeatherInsight:
        """
        Generates truthful travel-oriented insight using Groq LLM based strictly on real weather data.
        """
        if not weather_result.forecast_available:
            return WeatherInsight(
                summary=f"Live forecast is not yet available for travel dates in {weather_result.location}. Real-time conditions unlock closer to departure.",
                recommendations=[
                    "Check local seasonal averages when planning wardrobe.",
                    "Keep outdoor itineraries flexible pending 14-day forecast updates.",
                    "Review destination seasonal weather patterns prior to departure."
                ]
            )

        # Format weather days for prompt
        lines = []
        for d in weather_result.weather_days[:7]:
            lines.append(
                f"- {d.date}: {d.condition}, Temp: {d.temperature}°C (Min: {d.temperature_min}°C, Max: {d.temperature_max}°C), Rain Prob: {d.precipitation_probability}%, Wind: {d.wind_speed} km/h"
            )
        weather_days_text = "\n".join(lines) if lines else "No daily breakdown available."

        try:
            llm = get_llm()
            structured_llm = llm.with_structured_output(WeatherInsight)
            prompt = ChatPromptTemplate.from_messages([
                ("system", WEATHER_INSIGHT_SYSTEM),
                ("human", WEATHER_INSIGHT_HUMAN)
            ])
            chain = prompt | structured_llm

            insight: WeatherInsight = await chain.ainvoke({
                "location": weather_result.location,
                "forecast_available": str(weather_result.forecast_available),
                "source_status": weather_result.source_status,
                "planning_notes": weather_result.planning_notes or "None",
                "weather_days_text": weather_days_text,
                "travel_context": travel_context
            })
            return insight
        except Exception as e:
            logger.warning(f"Error generating LLM weather insight: {e}")
            # Truthful fallback insight directly from data
            avg_temp = None
            if weather_result.weather_days:
                valid_temps = [d.temperature for d in weather_result.weather_days if d.temperature is not None]
                if valid_temps:
                    avg_temp = round(sum(valid_temps) / len(valid_temps), 1)

            temp_text = f"averaging around {avg_temp}°C" if avg_temp else "with variable temperatures"
            return WeatherInsight(
                summary=f"Forecast indicates conditions {temp_text} in {weather_result.location} during your travel dates.",
                recommendations=[
                    "Dress in comfortable layers suitable for local temperature ranges.",
                    "Keep outdoor schedules adaptable based on daily morning sky conditions."
                ]
            )

weather_tool = WeatherTool()
