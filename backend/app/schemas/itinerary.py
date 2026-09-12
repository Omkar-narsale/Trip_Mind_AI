from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ItineraryActivity(BaseModel):
    activity_id: str = Field(..., description="Unique activity identifier.")
    time: str = Field(..., description="Estimated time slot (e.g. '09:00', '13:00').")
    type: str = Field(..., description="Activity category: 'arrival', 'departure', 'attraction', 'food', 'hotel', 'transport', 'rest'.")
    title: str = Field(..., description="Concise activity title.")
    description: Optional[str] = Field(default=None, description="Detailed guidance or activity context.")
    place_name: Optional[str] = Field(default=None, description="POI or venue name.")
    latitude: Optional[float] = Field(default=None, description="Geographic latitude coordinate.")
    longitude: Optional[float] = Field(default=None, description="Geographic longitude coordinate.")
    transport_mode: Optional[str] = Field(default=None, description="Recommended transportation mode if transit activity.")
    origin: Optional[str] = Field(default=None, description="Transit origin name.")
    destination: Optional[str] = Field(default=None, description="Transit destination name.")
    distance_km: Optional[float] = Field(default=None, description="Straight-line distance in km.")
    accessibility_notes: Optional[str] = Field(default=None, description="Accessibility or mobility advisory.")
    weather_note: Optional[str] = Field(default=None, description="Weather-adapted note if outdoor.")

class ItineraryDay(BaseModel):
    day_number: int = Field(..., description="Sequential day number (1, 2, ...).")
    date: str = Field(..., description="Date formatted as YYYY-MM-DD.")
    title: str = Field(..., description="Day title or headline.")
    theme: Optional[str] = Field(default=None, description="Focus hub or theme for the day.")
    weather_summary: Optional[str] = Field(default=None, description="Weather forecast summary for this day.")
    activities: List[ItineraryActivity] = Field(default_factory=list, description="Ordered list of activities.")

class TripSummary(BaseModel):
    destination: str = Field(...)
    origin: Optional[str] = Field(default=None)
    start_date: str = Field(...)
    end_date: str = Field(...)
    travelers: int = Field(default=1)
    travel_style: Optional[str] = Field(default=None)
    hotel_name: Optional[str] = Field(default=None)
    accessibility_active: bool = Field(default=False)

class ItineraryValidation(BaseModel):
    is_valid: bool = Field(default=True)
    dates_valid: bool = Field(default=True)
    no_duplicate_attractions: bool = Field(default=True)
    transit_modes_valid: bool = Field(default=True)
    accessibility_respected: bool = Field(default=True)
    weather_adjusted: bool = Field(default=True)
    pace_balanced: bool = Field(default=True)
    validation_notes: List[str] = Field(default_factory=list)

class ItineraryResult(BaseModel):
    trip_summary: TripSummary = Field(...)
    days: List[ItineraryDay] = Field(default_factory=list)
    total_days: int = Field(default=0)
    total_activities: int = Field(default=0)
    validation: ItineraryValidation = Field(default_factory=ItineraryValidation)
    generation_notes: Optional[str] = Field(default=None)
