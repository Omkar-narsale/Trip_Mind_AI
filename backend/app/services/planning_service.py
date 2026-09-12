import logging
from typing import Dict, Any, Optional, List

from app.schemas.travel_preferences import EnhancedTripProfile
from app.schemas.weather import WeatherResult, WeatherInsight
from app.schemas.places import PlacesResult, RankedAttraction
from app.schemas.hotel import HotelResult, RankedHotel
from app.schemas.transportation import TransportationResult
from app.schemas.food import FoodResult
from app.schemas.itinerary import ItineraryResult
from app.schemas.travel_plan import (
    TravelPlanResponse, 
    TravelPlanningResult, 
    ExecutionSummary,
    TravelPlanningTask
)

logger = logging.getLogger(__name__)

class PlanningService:
    @classmethod
    async def create_travel_plan(
        cls, 
        profile: EnhancedTripProfile,
        session_id: Optional[str] = None
    ) -> TravelPlanResponse:
        """
        Executes the LangGraph autonomous travel planning workflow on an EnhancedTripProfile.
        """
        from app.agents.planner_agent import planner_graph
        initial_state = {
            "session_id": session_id,
            "enhanced_trip_profile": profile.model_dump(),
            "planning_tasks": [],
            "current_task": None,
            "completed_tasks": [],
            "weather_result": None,
            "weather_insight": None,
            "places_result": None,
            "ranked_attractions": None,
            "hotel_result": None,
            "ranked_hotels": None,
            "transportation_result": None,
            "food_result": None,
            "itinerary_result": None,
            "agent_messages": [],
            "planning_status": "not_started",
            "planning_result": None,
            "errors": []
        }

        try:
            # Execute compiled LangGraph workflow asynchronously
            final_state = await planner_graph.ainvoke(initial_state)

            planning_result_data = final_state.get("planning_result") or {}
            completed_tasks_data = final_state.get("completed_tasks") or []
            messages = final_state.get("agent_messages") or []
            status = final_state.get("planning_status") or "completed"
            weather_res_data = final_state.get("weather_result")
            weather_ins_data = final_state.get("weather_insight")
            places_res_data = final_state.get("places_result")
            ranked_attr_data = final_state.get("ranked_attractions")
            hotel_res_data = final_state.get("hotel_result")
            ranked_hotel_data = final_state.get("ranked_hotels")

            # Reconstruct validated Pydantic objects
            tasks_objs = [TravelPlanningTask(**t) for t in completed_tasks_data]
            
            planning_result = TravelPlanningResult(
                overall_goal=planning_result_data.get("overall_goal", "Synthesize travel plan"),
                planning_strategy=planning_result_data.get("planning_strategy", "Dynamic task decomposition"),
                key_constraints=planning_result_data.get("key_constraints", profile.combined_constraints),
                tasks=tasks_objs
            )

            execution_summary = ExecutionSummary(
                status=status,
                completed_tasks=tasks_objs,
                messages=messages
            )

            weather_context_obj = WeatherResult(**weather_res_data) if weather_res_data else None
            weather_insight_obj = WeatherInsight(**weather_ins_data) if weather_ins_data else None
            places_context_obj = PlacesResult(**places_res_data) if places_res_data else None
            ranked_attractions_objs = (
                [RankedAttraction(**r) for r in ranked_attr_data]
                if ranked_attr_data is not None else None
            )
            hotel_context_obj = HotelResult(**hotel_res_data) if hotel_res_data else None
            ranked_hotels_objs = (
                [RankedHotel(**h) for h in ranked_hotel_data]
                if ranked_hotel_data is not None else None
            )

            transportation_res_data = final_state.get("transportation_result")
            transportation_context_obj = (
                TransportationResult(**transportation_res_data)
                if transportation_res_data else None
            )

            food_res_data = final_state.get("food_result")
            food_context_obj = (
                FoodResult(**food_res_data)
                if food_res_data else None
            )

            itinerary_res_data = final_state.get("itinerary_result")
            itinerary_context_obj = (
                ItineraryResult(**itinerary_res_data)
                if itinerary_res_data else None
            )

            return TravelPlanResponse(
                success=True,
                session_id=session_id,
                planning_result=planning_result,
                execution=execution_summary,
                weather_context=weather_context_obj,
                weather_insight=weather_insight_obj,
                places_context=places_context_obj,
                ranked_attractions=ranked_attractions_objs,
                hotel_context=hotel_context_obj,
                ranked_hotels=ranked_hotels_objs,
                transportation_context=transportation_context_obj,
                food_context=food_context_obj,
                itinerary_context=itinerary_context_obj,
                warning=None
            )

        except ValueError as val_err:
            logger.error(f"Validation or configuration error in PlanningService: {val_err}")
            raise val_err

        except Exception as e:
            logger.error(f"Error during LangGraph planning workflow execution: {e}", exc_info=True)
            raise RuntimeError(f"Autonomous planning workflow failed: {str(e)}")

planning_service = PlanningService()
