from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class FoodVenue(BaseModel):
    """Verified food and dining venue discovered from OpenStreetMap."""
    venue_id: str = Field(..., description="OSM node/way identifier.")
    name: str = Field(..., description="Canonical restaurant or cafe name.")
    cuisine: Optional[str] = Field(default="Local Cuisine", description="Cuisine type or culinary style.")
    latitude: float = Field(..., description="Geographic latitude coordinate.")
    longitude: float = Field(..., description="Geographic longitude coordinate.")
    address: Optional[str] = Field(default=None, description="Physical address if available.")
    distance_km: Optional[float] = Field(default=None, description="Straight-line distance from destination center.")
    relevance_score: int = Field(default=80, ge=0, le=100, description="Match percentage score.")
    suitability_reason: str = Field(default="Popular local dining venue matching your preferences.", description="Why this venue matches traveler context.")
    dietary_notes: Optional[str] = Field(default=None, description="Dietary compatibility notes (vegetarian, vegan, halal, family-friendly).")
    price_level: Optional[str] = Field(default="Moderate", description="Budget level: Budget, Moderate, Fine Dining.")
    source: str = Field(default="OpenStreetMap / Overpass API", description="Data source.")

class FoodResult(BaseModel):
    destination: str = Field(..., description="Queried destination.")
    latitude: Optional[float] = Field(default=None)
    longitude: Optional[float] = Field(default=None)
    venues: List[FoodVenue] = Field(default_factory=list, description="List of recommended dining venues.")
    total_found: int = Field(default=0)
    source_status: str = Field(default="success")
    message: Optional[str] = Field(default=None)
