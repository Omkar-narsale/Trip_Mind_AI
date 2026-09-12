import logging
from typing import Tuple, List, Optional

from app.schemas.hotel import HotelResult, RankedHotel
from app.schemas.travel_preferences import EnhancedTripProfile
from app.services.hotel_service import hotel_service
from app.services.hotel_ranker import hotel_ranker

logger = logging.getLogger(__name__)

class HotelTool:
    """Tool wrapper for discovering and ranking real accommodations for a trip."""

    @classmethod
    async def discover_and_rank_hotels(
        cls,
        destination: str,
        profile: EnhancedTripProfile,
        radius_meters: int = 15000,
        max_results: int = 20
    ) -> Tuple[HotelResult, List[RankedHotel]]:
        """
        Retrieves verified accommodations from OpenStreetMap and ranks them according to user profile.
        """
        try:
            hotel_res = await hotel_service.fetch_hotels_for_destination(
                destination=destination,
                radius_meters=radius_meters,
                max_results=max_results
            )

            if not hotel_res.hotels:
                return hotel_res, []

            ranked = await hotel_ranker.rank_hotels(
                hotel_result=hotel_res,
                profile=profile
            )

            return hotel_res, ranked

        except Exception as e:
            logger.error(f"Error executing HotelTool: {e}", exc_info=True)
            fallback_res = HotelResult(
                destination=destination,
                hotels=[],
                total_found=0,
                source_status="error",
                message=f"Could not discover accommodation options: {str(e)}"
            )
            return fallback_res, []

hotel_tool = HotelTool()
