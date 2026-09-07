from typing import List, Optional
from pydantic import BaseModel, Field, model_validator

class TripCreate(BaseModel):
    origin: str = Field(..., min_length=1, description="Starting location")
    destination: str = Field(..., min_length=1, description="Destination location")
    departure_date: str = Field(..., min_length=1, description="Departure date (YYYY-MM-DD)")
    return_date: str = Field(..., min_length=1, description="Return date (YYYY-MM-DD)")
    travelers: int = Field(..., ge=1, description="Number of travelers (must be at least 1)")
    budget: float = Field(..., gt=0, description="Total budget in currency amount (must be greater than 0)")
    preferences: List[str] = Field(default_factory=list, description="List of travel preferences")
    additional_instructions: Optional[str] = Field(
        default=None, 
        description="Optional natural-language travel instructions, special constraints, or style preferences"
    )

    @model_validator(mode="after")
    def validate_origin_destination(self):
        if self.origin.strip().lower() == self.destination.strip().lower():
            raise ValueError("Origin and destination cannot be the same location.")
        return self

class TripResponse(BaseModel):
    message: str = "Trip request received successfully"
    data: TripCreate
