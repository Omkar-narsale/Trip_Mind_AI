from typing import List, Optional
from pydantic import BaseModel, Field

class Waypoint(BaseModel):
    name: str = Field(..., description="Name of the stop or place")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    type: Optional[str] = Field(default="stop", description="hotel, place, food, hub, or custom")

class RouteStep(BaseModel):
    instruction: str = Field(..., description="Human-readable driving or walking maneuver")
    distance_km: float = Field(..., description="Distance for this segment in kilometers")
    duration_min: float = Field(..., description="Estimated travel time in minutes")
    road_name: Optional[str] = Field(default="", description="Name of the road or street")

class RoutePreviewRequest(BaseModel):
    origin: Waypoint
    destination: Waypoint
    waypoints: List[Waypoint] = Field(default_factory=list, description="Intermediate stops in sequential order")
    mode: str = Field(default="driving", description="'driving' or 'walking'")

class RoutePreviewResponse(BaseModel):
    origin: Waypoint
    destination: Waypoint
    mode: str
    total_distance_km: float
    total_duration_min: float
    polyline_coords: List[List[float]] = Field(..., description="Ordered [[lat, lon], ...] for Leaflet Polyline rendering")
    steps: List[RouteStep]
    source: str = Field(default="osrm", description="'osrm' or 'geodesic_fallback'")
