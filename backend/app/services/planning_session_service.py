import logging
from typing import Dict, Any, List, Optional
from app.schemas.trip import TripCreate
from app.schemas.travel_preferences import EnhancedTripProfile
from app.services.supabase_service import supabase_service
from app.services.trip_analyzer import trip_analyzer_service
from app.services.preference_analyzer import preference_analyzer_service
from app.services.profile_merger import profile_merger_service
from app.services.planning_service import planning_service

logger = logging.getLogger(__name__)

class PlanningSessionService:
    """High-level orchestration service for trip planning sessions and persistence."""

    @classmethod
    async def create_and_run_planning(cls, trip_data: TripCreate) -> Dict[str, Any]:
        """
        Executes the full Phase 7 planning lifecycle:
        1. Create planning session (status: 'created')
        2. Save trip request
        3. Synthesize EnhancedTripProfile (status: 'analyzing')
        4. Save enhanced profile
        5. Run LangGraph Autonomous Agent with session_id (status: 'planning')
        6. Tools persist real Weather, Places, and Hotel intelligence
        7. Update session status to 'completed' (or 'partial_success')
        8. Return consolidated trip payload
        """
        # 1. Create session
        session_record = await supabase_service.create_session(status="created")
        session_id = session_record["id"]

        # 2. Save trip request
        await supabase_service.save_trip_request(session_id, trip_data.model_dump())

        # 3. Synthesize Enhanced Trip Profile
        await supabase_service.update_session_status(session_id, status="analyzing")

        try:
            analysis_result = await trip_analyzer_service.analyze_trip(trip_data)
            trip_analysis = analysis_result.analysis
        except Exception as e:
            logger.error(f"Trip analysis error in session {session_id}: {e}")
            await supabase_service.update_session_status(session_id, status="failed")
            raise RuntimeError(f"Trip analysis failed: {str(e)}")

        extracted_preferences = None
        warning_message = None

        if trip_data.additional_instructions and trip_data.additional_instructions.strip():
            try:
                extracted_preferences = await preference_analyzer_service.extract_preferences(
                    user_instructions=trip_data.additional_instructions,
                    destination=trip_data.destination,
                    travelers=trip_data.travelers
                )
            except Exception as e:
                logger.warning(f"Preference extraction notice: {e}")
                warning_message = "Natural language instructions could not be fully parsed."

        profile_response = profile_merger_service.merge_profile(
            trip_request=trip_data,
            trip_analysis=trip_analysis,
            travel_preferences=extracted_preferences,
            warning=warning_message
        )
        profile_obj = profile_response.profile

        # 4. Save enhanced profile
        await supabase_service.save_trip_profile(session_id, profile_obj.model_dump())

        # 5. Execute LangGraph Planning with session_id
        await supabase_service.update_session_status(session_id, status="planning")

        try:
            plan_response = await planning_service.create_travel_plan(
                profile=profile_obj,
                session_id=session_id
            )

            sb_saves = []
            # Persist tool outcomes to Supabase / local fallback
            if plan_response.weather_context:
                sb_saves.append(await supabase_service.save_weather_result(
                    session_id, plan_response.weather_context.model_dump()
                ))

            if plan_response.places_context:
                places_dict = plan_response.places_context.model_dump()
                if plan_response.ranked_attractions:
                    places_dict["ranked_attractions"] = [r.model_dump() for r in plan_response.ranked_attractions]
                sb_saves.append(await supabase_service.save_places_result(session_id, places_dict))

            if plan_response.hotel_context:
                hotel_dict = plan_response.hotel_context.model_dump()
                if plan_response.ranked_hotels:
                    hotel_dict["ranked_hotels"] = [h.model_dump() for h in plan_response.ranked_hotels]
                sb_saves.append(await supabase_service.save_hotel_result(session_id, hotel_dict))

            if plan_response.transportation_context:
                sb_saves.append(await supabase_service.save_transportation_result(
                    session_id, plan_response.transportation_context.model_dump()
                ))

            if plan_response.food_context:
                sb_saves.append(await supabase_service.save_food_result(
                    session_id, plan_response.food_context.model_dump()
                ))

            if plan_response.itinerary_context:
                sb_saves.append(await supabase_service.save_itinerary_result(
                    session_id, plan_response.itinerary_context.model_dump()
                ))

            final_status = "completed"
            if plan_response.warning or (plan_response.hotel_context and plan_response.hotel_context.source_status == "error"):
                final_status = "partial_success"

            await supabase_service.update_session_status(session_id, status=final_status)

            is_cloud_persisted = bool(sb_saves and all(sb_saves))
            persistence_meta = {
                "supabase": is_cloud_persisted,
                "local_fallback": True,
                "status": "cloud_persisted" if is_cloud_persisted else "local_only"
            }
            plan_response.persistence = persistence_meta

            return {
                "session_id": session_id,
                "status": final_status,
                "persistence": persistence_meta,
                "profile": profile_obj,
                "plan": plan_response,
                "weather_context": plan_response.weather_context,
                "weather_insight": plan_response.weather_insight,
                "places_context": plan_response.places_context,
                "ranked_attractions": plan_response.ranked_attractions,
                "hotel_context": plan_response.hotel_context,
                "ranked_hotels": plan_response.ranked_hotels,
                "transportation_context": plan_response.transportation_context,
                "food_context": plan_response.food_context,
                "itinerary_context": plan_response.itinerary_context
            }

        except Exception as plan_err:
            logger.error(f"Planning agent error for session {session_id}: {plan_err}", exc_info=True)
            await supabase_service.update_session_status(session_id, status="partial_success")
            raise plan_err

    @classmethod
    async def list_saved_sessions(cls) -> List[Dict[str, Any]]:
        """Returns list of previous planning sessions."""
        return await supabase_service.list_sessions()

    @classmethod
    async def get_saved_session(cls, session_id: str) -> Optional[Dict[str, Any]]:
        """Returns complete saved planning session."""
        return await supabase_service.get_session(session_id)

planning_session_service = PlanningSessionService()
