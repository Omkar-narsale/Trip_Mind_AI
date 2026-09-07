from app.schemas.trip import TripCreate, TripResponse

class TripService:
    @staticmethod
    def process_trip_request(trip_data: TripCreate) -> TripResponse:
        """
        Process the validated trip data and format the response for Phase 1.
        """
        return TripResponse(
            message="Trip request received successfully",
            data=trip_data
        )

trip_service = TripService()
