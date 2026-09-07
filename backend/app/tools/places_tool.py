import logging
from typing import Tuple, List, Optional

from app.schemas.places import PlacesResult, RankedAttraction
from app.schemas.travel_preferences import EnhancedTripProfile
from app.schemas.weather import WeatherResult
from app.services.places_service import places_service
from app.services.attraction_ranker import attraction_ranker

logger = logging.getLogger(__name__)

class PlacesTool:
    """Tool wrapper for discovering and ranking real OpenStreetMap places for a trip."""

    @classmethod
    async def discover_and_rank_places(
        cls,
        destination: str,
        profile: EnhancedTripProfile,
        weather_result: Optional[WeatherResult] = None
    ) -> Tuple[PlacesResult, List[RankedAttraction]]:
        """
        Retrieves real places from OpenStreetMap and ranks them according to user preferences.
        """
        try:
            places_res = await places_service.fetch_places_for_destination(
                destination=destination,
                radius_meters=12000,
                max_results=25
            )

            if not places_res.places:
                return places_res, []

            ranked = await attraction_ranker.rank_attractions(
                places_result=places_res,
                profile=profile,
                weather_result=weather_result
            )

            return places_res, ranked

        except Exception as e:
            logger.error(f"Error executing PlacesTool: {e}", exc_info=True)
            fallback_res = PlacesResult(
                destination=destination,
                places=[],
                total_found=0,
                source_status="error",
                message=f"Could not discover attractions: {str(e)}"
            )
            return fallback_res, []

places_tool = PlacesTool()
