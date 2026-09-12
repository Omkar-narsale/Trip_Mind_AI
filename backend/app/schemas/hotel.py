from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Hotel(BaseModel):
    """Normalized real accommodation record."""
    hotel_id: str = Field(..., description="Unique provider ID or OSM identifier.")
    name: str = Field(..., description="Verified name of the hotel or lodging.")
    latitude: float = Field(..., description="Geographical latitude coordinate.")
    longitude: float = Field(..., description="Geographical longitude coordinate.")
    address: Optional[str] = Field(default=None, description="Physical street or municipal address if available.")
    rating: Optional[float] = Field(default=None, description="Rating or stars if provided by source; null when unavailable.")
    review_count: Optional[int] = Field(default=None, description="Number of reviews if provided by source; null when unavailable.")
    price: Optional[float] = Field(default=None, description="Price per night if provided by source; null when unavailable.")
    currency: Optional[str] = Field(default=None, description="Currency code (e.g., USD, INR, EUR) if price is available.")
    accommodation_type: Optional[str] = Field(default="Hotel", description="Type of lodging: Hotel, Boutique, Resort, Hostel, Guest House, Apartment, Motel.")
    source: str = Field(default="OpenStreetMap / Overpass API", description="Data provider attribution.")
    booking_url: Optional[str] = Field(default=None, description="Official website or booking reference link if available.")
    distance_km: Optional[float] = Field(default=None, description="Calculated distance in km from destination center.")

class RankedHotel(BaseModel):
    """Contextually scored hotel based on trip budget, travel style, and preferences."""
    hotel: Hotel = Field(..., description="The verified real hotel object.")
    relevance_score: int = Field(..., ge=0, le=100, description="Relevance score between 0 and 100.")
    relevance_level: str = Field(default="medium", description="'high' (>=80), 'medium' (50-79), or 'low' (<50).")
    matched_preferences: List[str] = Field(default_factory=list, description="List of matched trip preferences (e.g., Central, Budget, Relaxed, Family).")
    suitability_reason: str = Field(..., description="Concise explanation why this accommodation matches the traveler's context.")
    potential_considerations: List[str] = Field(default_factory=list, description="Practical considerations (transit access, quietness, walkability).")

class HotelResult(BaseModel):
    """Structured response from the Hotel Tool."""
    destination: str = Field(..., description="Destination queried.")
    latitude: Optional[float] = Field(default=None, description="Resolved center latitude.")
    longitude: Optional[float] = Field(default=None, description="Resolved center longitude.")
    hotels: List[Hotel] = Field(default_factory=list, description="List of verified accommodations discovered.")
    total_found: int = Field(default=0, description="Total count of accommodations discovered.")
    source_status: str = Field(default="success", description="Status: 'success', 'no_results', or 'error'.")
    message: Optional[str] = Field(default=None, description="Informational or error message.")

class RankedHotelList(BaseModel):
    """Wrapper for structured LLM ranking output."""
    ranked_hotels: List[RankedHotel] = Field(default_factory=list, description="List of scored and ranked hotels.")
