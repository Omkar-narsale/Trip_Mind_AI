from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class PackingItem(BaseModel):
    item_name: str = Field(..., description="Name of the packing item")
    reason: str = Field(..., description="Why this item is recommended based on climate, terrain, or activity")
    is_essential: bool = Field(default=True, description="Whether this item is critical or optional")
    category: str = Field(..., description="Clothing & Layers, Footwear, Health & Toiletries, Electronics, or Documents")

class TravelAdvisory(BaseModel):
    title: str = Field(..., description="Short advisory title")
    description: str = Field(..., description="Practical regional advice, rule, or tip")
    advisory_type: str = Field(default="general", description="climate, connectivity, regulations, or health")

class PackingRequest(BaseModel):
    destination: str = Field(..., description="Destination name (e.g. Kashmir)")
    origin: Optional[str] = Field(default=None, description="Starting location")
    departure_date: Optional[str] = Field(default=None, description="Trip start date")
    return_date: Optional[str] = Field(default=None, description="Trip end date")
    duration_days: Optional[int] = Field(default=5, description="Total days")
    weather_summary: Optional[str] = Field(default=None, description="Forecast summary")
    temperature_max: Optional[float] = Field(default=None, description="Max daytime temp in C")
    temperature_min: Optional[float] = Field(default=None, description="Min nighttime temp in C")
    travelers: Optional[int] = Field(default=2, description="Number of travelers")
    travel_style: Optional[str] = Field(default="Balanced", description="Travel style")

class PackingResponse(BaseModel):
    destination: str
    climate_summary: str
    items: List[PackingItem] = Field(default_factory=list)
    advisories: List[TravelAdvisory] = Field(default_factory=list)
