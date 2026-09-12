from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class TripChatRequest(BaseModel):
    message: str = Field(..., description="User question, request, or instruction")
    destination: str = Field(..., description="Destination location (e.g. Kashmir)")
    origin: Optional[str] = Field(default=None, description="Starting location")
    departure_date: Optional[str] = Field(default=None, description="Trip start date")
    return_date: Optional[str] = Field(default=None, description="Trip end date")
    travelers: Optional[int] = Field(default=1, description="Number of travelers")
    budget: Optional[float] = Field(default=None, description="Total budget")
    hotel_name: Optional[str] = Field(default=None, description="Selected accommodation")
    trip_summary: Optional[str] = Field(default=None, description="Summary or style of trip")
    activities_summary: Optional[List[str]] = Field(default_factory=list, description="Key scheduled activities")
    weather_summary: Optional[str] = Field(default=None, description="Destination weather overview")
    session_id: Optional[str] = Field(default=None, description="Active planning session ID")

class TripChatResponse(BaseModel):
    reply: str = Field(..., description="AI concierge response tailored to the traveler")
    suggested_followups: List[str] = Field(default_factory=list, description="Relevant quick-reply question chips")
