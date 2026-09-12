from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class LocationType(str, Enum):
    HOTEL = "hotel"
    ATTRACTION = "attraction"
    DESTINATION_CENTER = "destination_center"

class TransportationMode(str, Enum):
    WALKING = "walking"
    TAXI_OR_CAB = "taxi / cab"
    CAB_TAXI = "taxi / cab"
    PUBLIC_TRANSIT = "public transport"
    PRIVATE_VEHICLE = "private vehicle"
    MIXED = "mixed"
    OTHER = "other"

class LocationPoint(BaseModel):
    """Geographic point representing a hotel, attraction, or city center."""
    name: str = Field(..., description="Name of the place, hotel, or center point.")
    latitude: float = Field(..., description="Geographic latitude coordinate.")
    longitude: float = Field(..., description="Geographic longitude coordinate.")
    location_type: LocationType = Field(default=LocationType.ATTRACTION, description="Type: hotel, attraction, destination_center.")
    place_id: Optional[str] = Field(default=None, description="Identifier matching Place or Hotel if available.")

class LocationCluster(BaseModel):
    """Geographically proximate cluster of attractions."""
    cluster_id: str = Field(..., description="Unique cluster identifier.")
    cluster_name: str = Field(..., description="Descriptive title of the geographic hub or area.")
    locations: List[LocationPoint] = Field(default_factory=list, description="List of location points in this cluster.")
    center_lat: float = Field(..., description="Mean latitude coordinate of cluster centroid.")
    center_lon: float = Field(..., description="Mean longitude coordinate of cluster centroid.")
    approximate_span_km: float = Field(default=0.0, description="Approximate geographic span or radius in kilometers.")
    proximity_note: str = Field(..., description="Explanation of why these locations can be grouped together.")

    @property
    def attraction_names(self) -> List[str]:
        return [loc.name for loc in self.locations]

    @property
    def centroid_latitude(self) -> float:
        return self.center_lat

    @property
    def centroid_longitude(self) -> float:
        return self.center_lon

    @property
    def cluster_radius_km(self) -> float:
        return round(self.approximate_span_km / 2.0, 2)

class TransportationRecommendation(BaseModel):
    """Structured transit recommendation between points or from lodging to a cluster."""
    origin_name: str = Field(..., description="Starting point or accommodation name.")
    destination_name: str = Field(..., description="Destination point or cluster name.")
    origin_type: LocationType = Field(default=LocationType.HOTEL)
    destination_type: LocationType = Field(default=LocationType.ATTRACTION)
    distance_km: float = Field(..., description="Deterministic straight-line Haversine distance in kilometers.")
    recommended_mode: TransportationMode = Field(..., description="Primary recommended mode of transit.")
    alternative_modes: List[TransportationMode] = Field(default_factory=list, description="Viable alternative modes.")
    suitability_reason: str = Field(..., description="Explanation based on distance, group size, and travel pace.")
    accessibility_consideration: Optional[str] = Field(default=None, description="Notes on walking ease, mobility, or family convenience.")
    optimization_note: Optional[str] = Field(default=None, description="Advice on sequencing, cluster visits, or transit efficiency.")
    practical_transit_tips: List[str] = Field(default_factory=list, description="Actionable transit advice.")

    @property
    def from_location(self) -> str:
        return self.origin_name

    @property
    def to_location(self) -> str:
        return self.destination_name

class TransportationResult(BaseModel):
    """Consolidated result from Transportation Intelligence and Route Optimization."""
    destination: str = Field(..., description="Destination analyzed.")
    total_locations_analyzed: int = Field(default=0, description="Total count of points with valid coordinates.")
    total_clusters: int = Field(default=0, description="Count of attraction clusters.")
    clusters: List[LocationCluster] = Field(default_factory=list, description="Identified geographic attraction clusters.")
    recommendations: List[TransportationRecommendation] = Field(default_factory=list, description="Transit recommendations across key movement corridors.")
    optimization_insights: List[str] = Field(default_factory=list, description="Strategic insights to reduce transit overhead and backtracking.")
    route_optimization_insights: List[str] = Field(default_factory=list, description="Alias for optimization insights.")
    summary: Optional[str] = Field(default=None, description="High-level mobility and transit overview.")
    accessibility_applied: bool = Field(default=False, description="True if special walking/mobility rules were enforced.")
    accessibility_notes: Optional[str] = Field(default=None, description="Specific accessibility or mobility instructions applied.")
    notes: Optional[str] = Field(
        default="Approximate straight-line geographic distance using the Haversine formula. Actual road travel distance and transit times vary by local road network and traffic conditions.",
        description="Disclaimer on straight-line vs actual road travel."
    )
    data_honesty_disclaimer: str = Field(
        default="Approximate straight-line geographic distance using the Haversine formula. Actual road travel distance and transit times vary by local road network and traffic conditions.",
        description="Explicit honesty notice."
    )
