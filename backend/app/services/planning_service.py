import logging
from typing import Dict, Any, Optional, List

from app.schemas.travel_preferences import EnhancedTripProfile
from app.schemas.weather import WeatherResult, WeatherInsight
from app.schemas.places import PlacesResult, RankedAttraction
from app.schemas.travel_plan import (
    TravelPlanResponse, 
    TravelPlanningResult, 
    ExecutionSummary,
    TravelPlanningTask
)
from app.agents.planner_agent import planner_graph

logger = logging.getLogger(__name__)

class PlanningService:
    @classmethod
    async def create_travel_plan(cls, profile: EnhancedTripProfile) -> TravelPlanResponse:
        """
        Executes the LangGraph autonomous travel planning workflow on an EnhancedTripProfile.
        """
        initial_state = {
            "enhanced_trip_profile": profile.model_dump(),
            "planning_tasks": [],
            "current_task": None,
            "completed_tasks": [],
            "weather_result": None,
            "weather_insight": None,
            "places_result": None,
            "ranked_attractions": None,
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

            return TravelPlanResponse(
                success=True,
                planning_result=planning_result,
                execution=execution_summary,
                weather_context=weather_context_obj,
                weather_insight=weather_insight_obj,
                places_context=places_context_obj,
                ranked_attractions=ranked_attractions_objs,
                warning=None
            )

        except ValueError as val_err:
            logger.error(f"Validation or configuration error in PlanningService: {val_err}")
            raise val_err

        except Exception as e:
            logger.error(f"Error during LangGraph planning workflow execution: {e}", exc_info=True)
            raise RuntimeError(f"Autonomous planning workflow failed: {str(e)}")

planning_service = PlanningService()
