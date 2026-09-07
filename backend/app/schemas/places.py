from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Place(BaseModel):
    place_id: str = Field(..., description="Unique identifier for the place/POI (e.g. OSM node/way ID).")
    name: str = Field(..., description="Canonical name of the attraction or point of interest.")
    category: str = Field(..., description="Normalized category (e.g. Historical & Heritage, Museum, Nature & Park, Viewpoint, Cultural Landmark).")
    latitude: float = Field(..., description="Geographic latitude coordinate.")
    longitude: float = Field(..., description="Geographic longitude coordinate.")
    description: Optional[str] = Field(default=None, description="Real description or tags from source data if available.")
    tags: Dict[str, str] = Field(default_factory=dict, description="Raw OpenStreetMap tags associated with this place.")
    distance_km: Optional[float] = Field(default=None, description="Distance from destination center coordinates in kilometers.")
    source: str = Field(default="OpenStreetMap / Overpass API", description="Data provider attribution.")

class PlacesResult(BaseModel):
    destination: str = Field(..., description="Target destination name.")
    latitude: Optional[float] = Field(default=None, description="Resolved center latitude coordinate.")
    longitude: Optional[float] = Field(default=None, description="Resolved center longitude coordinate.")
    places: List[Place] = Field(default_factory=list, description="List of real normalized places retrieved from Overpass API.")
    total_found: int = Field(default=0, description="Total count of places discovered.")
    source_status: str = Field(default="success", description="Status: 'success', 'no_results', or 'error'.")
    message: Optional[str] = Field(default=None, description="User-safe status or advisory message.")

class RankedAttraction(BaseModel):
    place: Place = Field(..., description="Real place object.")
    relevance_score: int = Field(..., ge=0, le=100, description="Relevance score from 0 to 100 based on user preferences and context.")
    relevance_level: str = Field(default="medium", description="Relevance tier: 'high', 'medium', or 'low'.")
    matched_preferences: List[str] = Field(default_factory=list, description="Specific user preferences matched (e.g., 'History', 'Scenic Views').")
    suitability_reason: str = Field(..., description="Concise explanation of why this real place fits the user's travel style/mood.")
    potential_considerations: List[str] = Field(default_factory=list, description="Actionable practical considerations or weather caveats.")

class RankedAttractionList(BaseModel):
    attractions: List[RankedAttraction] = Field(default_factory=list, description="List of ranked attractions.")
