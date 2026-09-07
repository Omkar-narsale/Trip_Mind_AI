from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.trip import TripCreate
from app.schemas.trip_analysis import TripAnalysis

class ExtractedTravelPreferences(BaseModel):
    travel_mood: Optional[str] = Field(
        default=None, 
        description="Atmosphere or emotional tone desired (e.g., 'peaceful', 'adventurous', 'romantic', 'rejuvenating')."
    )
    pace: Optional[str] = Field(
        default=None, 
        description="Desired speed/density of the itinerary (e.g., 'relaxed', 'moderate', 'fast-paced / packed')."
    )
    accommodation_preferences: Optional[str] = Field(
        default=None, 
        description="Specific accommodation style or location requirements (e.g., 'beachfront hotel', 'quiet boutique resort')."
    )
    preferred_activities: List[str] = Field(
        default_factory=list, 
        description="Explicit or strongly implied activities requested in natural language."
    )
    avoided_activities: List[str] = Field(
        default_factory=list, 
        description="Explicitly disliked or restricted activities (e.g., 'adventure sports', 'crowded nightlife', 'hiking')."
    )
    food_preferences: Optional[str] = Field(
        default=None, 
        description="Culinary interests or dietary specifications (e.g., 'local street food', 'vegetarian', 'fine dining')."
    )
    transportation_preferences: Optional[str] = Field(
        default=None, 
        description="Preferences regarding travel transit or mobility (e.g., 'minimize travel between locations', 'scenic train')."
    )
    traveler_context: Optional[str] = Field(
        default=None, 
        description="Group composition details (e.g., 'family with young children', 'travelling with elderly parents', 'solo trip')."
    )
    accessibility_or_special_constraints: Optional[str] = Field(
        default=None, 
        description="Accessibility needs, mobility limitations, or specific medical/schedule restrictions."
    )
    additional_constraints: List[str] = Field(
        default_factory=list, 
        description="Specific negative or positive constraints mentioned by the user."
    )
    confidence_notes: Optional[str] = Field(
        default=None, 
        description="Brief note regarding clarity or any interpreted nuances from user input."
    )

class EnhancedTripProfile(BaseModel):
    trip_request: TripCreate = Field(
        ..., 
        description="The original user input and structured itinerary parameters."
    )
    trip_analysis: TripAnalysis = Field(
        ..., 
        description="Baseline AI analysis of destination, budget feasibility, and durations."
    )
    travel_preferences: Optional[ExtractedTravelPreferences] = Field(
        default=None, 
        description="Structured extraction of natural-language travel desires, restrictions, and nuances."
    )
    combined_constraints: List[str] = Field(
        default_factory=list, 
        description="De-duplicated consolidated list of planning constraints from both analysis and natural language."
    )
    planning_context: Dict[str, Any] = Field(
        default_factory=dict, 
        description="Contextual synthesis summarizing travel style, group dynamics, mood, and pace."
    )

class EnhancedTripProfileResponse(BaseModel):
    success: bool = True
    profile: EnhancedTripProfile
    warning: Optional[str] = None
