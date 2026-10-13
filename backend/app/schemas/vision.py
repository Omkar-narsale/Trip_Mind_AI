from typing import List, Optional
from pydantic import BaseModel, Field

class ScannedTicketResult(BaseModel):
    document_type: str = Field(default="Flight Ticket", description="Type of document (Flight Ticket, Hotel Voucher, Train Ticket, etc.)")
    origin: Optional[str] = Field(default=None, description="Departure origin city or airport (e.g. Mumbai, New Delhi, JFK)")
    destination: Optional[str] = Field(default=None, description="Arrival destination city or region (e.g. Jaipur, Goa, Paris)")
    departure_date: Optional[str] = Field(default=None, description="Departure date in YYYY-MM-DD format if detected")
    return_date: Optional[str] = Field(default=None, description="Return date in YYYY-MM-DD format if detected")
    travelers_count: int = Field(default=1, description="Number of passengers or guests identified")
    passenger_names: List[str] = Field(default_factory=list, description="List of passenger or guest names")
    carrier_or_hotel: Optional[str] = Field(default=None, description="Airline flight number or Hotel name")
    booking_reference_pnr: Optional[str] = Field(default=None, description="PNR or Confirmation Booking Reference code")
    budget_estimate: Optional[float] = Field(default=None, description="Fare or total cost if mentioned on the document")
    notes: List[str] = Field(default_factory=list, description="Key notes, seat numbers, or baggage limits")
    confidence_score: float = Field(default=0.95, description="Model extraction confidence score (0.0 to 1.0)")

class VisionScanRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image string (with or without data:image prefix)")
    mime_type: str = Field(default="image/jpeg", description="MIME type (image/jpeg, image/png, image/webp)")

class VisionScanResponse(BaseModel):
    success: bool
    data: ScannedTicketResult
    message: str
