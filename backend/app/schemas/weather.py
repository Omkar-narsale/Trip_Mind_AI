from typing import List, Optional
from pydantic import BaseModel, Field

class WeatherDay(BaseModel):
    date: str = Field(..., description="Forecast date in YYYY-MM-DD format.")
    condition: str = Field(..., description="Human-readable weather condition (e.g., 'Sunny', 'Partly Cloudy', 'Rain Showers').")
    temperature: Optional[float] = Field(default=None, description="Average or midday temperature in Celsius.")
    temperature_min: Optional[float] = Field(default=None, description="Minimum daily temperature in Celsius.")
    temperature_max: Optional[float] = Field(default=None, description="Maximum daily temperature in Celsius.")
    precipitation_probability: Optional[int] = Field(default=None, description="Maximum precipitation probability (0-100%).")
    precipitation_amount: Optional[float] = Field(default=None, description="Estimated total precipitation sum in millimeters.")
    wind_speed: Optional[float] = Field(default=None, description="Maximum wind speed in km/h.")
    weather_code: Optional[int] = Field(default=None, description="WMO standard weather condition code.")

class WeatherResult(BaseModel):
    location: str = Field(..., description="Resolved destination name or coordinates.")
    latitude: Optional[float] = Field(default=None, description="Resolved geographic latitude.")
    longitude: Optional[float] = Field(default=None, description="Resolved geographic longitude.")
    forecast_available: bool = Field(default=True, description="True if real forecast data is available for requested dates.")
    weather_days: List[WeatherDay] = Field(default_factory=list, description="List of daily forecast or climate observations.")
    source_status: str = Field(default="live_forecast", description="Status code: 'live_forecast', 'out_of_range', 'location_not_found', or 'error'.")
    planning_notes: Optional[str] = Field(default=None, description="Truthful descriptive status or notes regarding data availability.")

class WeatherInsight(BaseModel):
    summary: str = Field(..., description="Truthful travel-oriented weather interpretation based strictly on returned data.")
    recommendations: List[str] = Field(default_factory=list, description="Practical activity or packing advice aligned with real weather metrics.")
