from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class BudgetLevel(str, Enum):
    BUDGET = "Budget"
    MODERATE = "Moderate"
    PREMIUM = "Premium"
    LUXURY = "Luxury"

class TripAnalysis(BaseModel):
    trip_summary: str = Field(
        ..., 
        description="A concise executive summary synthesizing the origin, destination, duration, and objective of the trip."
    )
    duration_days: int = Field(
        ..., 
        ge=1, 
        description="Calculated total duration of the trip in days."
    )
    travel_style: str = Field(
        ..., 
        description="Characterization of travel style based on user preferences and constraints (e.g. 'Fast-paced cultural exploration', 'Relaxed coastal retreat')."
    )
    budget_per_traveler: float = Field(
        ..., 
        gt=0, 
        description="Total allocated budget divided by the number of travelers."
    )
    budget_per_day: float = Field(
        ..., 
        gt=0, 
        description="Total allocated budget divided by total duration days."
    )
    budget_level: BudgetLevel = Field(
        ..., 
        description="Classification of the trip budget tier: Budget, Moderate, Premium, or Luxury."
    )
    priority_preferences: List[str] = Field(
        default_factory=list, 
        description="Key interests and focal points prioritized for this journey."
    )
    suggested_activity_categories: List[str] = Field(
        default_factory=list, 
        description="Recommended thematic activity categories aligned with destination and interests."
    )
    accommodation_expectation: str = Field(
        ..., 
        description="Realistic accommodation tier recommendation based on destination and budget."
    )
    planning_constraints: List[str] = Field(
        default_factory=list, 
        description="Key operational or budgetary limitations to consider during itinerary building."
    )
    notes: str = Field(
        ..., 
        description="Important planning caveats, seasonal advisories, or next-step considerations clearly labeled as estimates."
    )

class TripAnalysisResponse(BaseModel):
    success: bool = True
    analysis: TripAnalysis
