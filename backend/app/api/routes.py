import logging
from typing import Union, Dict, Any
from fastapi import APIRouter, HTTPException, status, Body
from app.schemas.trip import TripCreate, TripResponse
from app.schemas.trip_analysis import TripAnalysisResponse
from app.schemas.travel_preferences import EnhancedTripProfile, EnhancedTripProfileResponse
from app.schemas.travel_plan import TravelPlanResponse
from app.services.trip_service import trip_service
from app.services.trip_analyzer import trip_analyzer_service
from app.services.preference_analyzer import preference_analyzer_service
from app.services.profile_merger import profile_merger_service
from app.services.planning_service import planning_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post(
    "/trip",
    response_model=TripResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit and validate trip planning request",
    description="Phase 1: Validates trip parameters (origin, destination, dates, travelers, budget, preferences) and confirms receipt."
)
async def create_trip(trip_data: TripCreate):
    try:
        response = trip_service.process_trip_request(trip_data)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post(
    "/trip/analyze",
    response_model=TripAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze trip goal with Groq LLM",
    description="Phase 2: Uses Groq LLM to convert raw trip information into structured travel requirements."
)
async def analyze_trip(trip_data: TripCreate):
    try:
        analysis_response = await trip_analyzer_service.analyze_trip(trip_data)
        return analysis_response
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(val_err)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Trip Goal Analysis failed: {str(e)}"
        )

@router.post(
    "/trip/profile",
    response_model=EnhancedTripProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Create Enhanced Trip Profile with Natural Language Analysis",
    description="Phase 3: Analyzes structured inputs and extracts natural-language instructions using few-shot Groq LLM prompting."
)
async def create_enhanced_profile(trip_data: TripCreate):
    try:
        analysis_result = await trip_analyzer_service.analyze_trip(trip_data)
        trip_analysis = analysis_result.analysis
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(val_err)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Core trip analysis failed: {str(e)}"
        )

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
            logger.warning(f"Natural language preference extraction failed gracefully: {e}")
            warning_message = "Trip profile created, but natural language instructions could not be fully parsed."

    profile_response = profile_merger_service.merge_profile(
        trip_request=trip_data,
        trip_analysis=trip_analysis,
        travel_preferences=extracted_preferences,
        warning=warning_message
    )

    return profile_response

from pydantic import ValidationError
from app.services.planning_session_service import planning_session_service
from app.services.supabase_service import supabase_service

@router.post(
    "/trip/plan",
    response_model=TravelPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute LangGraph Autonomous Travel Planning Agent",
    description="Decomposes the EnhancedTripProfile into dependency-aware planning tasks and executes real Weather, Places, Accommodation, Transportation, and Itinerary tools."
)
@router.post(
    "/plan-trip",
    response_model=TravelPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute LangGraph Autonomous Travel Planning Agent (Alias)",
    description="Unified travel planning endpoint ensuring session creation and complete persistence."
)
async def plan_trip(payload: Union[EnhancedTripProfile, Dict[str, Any]] = Body(...)):
    try:
        session_id = None
        # Handle wrapped or direct EnhancedTripProfile
        if isinstance(payload, dict):
            session_id = payload.get("session_id")
            if "profile" in payload:
                profile_obj = EnhancedTripProfile(**payload["profile"])
            else:
                profile_data = {k: v for k, v in payload.items() if k != "session_id"}
                profile_obj = EnhancedTripProfile(**profile_data)
        else:
            profile_obj = payload

        # Always ensure a valid session_id exists and planning_sessions row is created
        if not session_id:
            session_rec = await supabase_service.create_session(status="planning")
            session_id = session_rec["id"]
            logger.info("[SESSION] Created session: %s", session_id)
        else:
            await supabase_service.ensure_session_exists(session_id, status="planning")
            logger.info("[SESSION] Using existing session: %s", session_id)

        # Persist trip request & profile immediately
        if profile_obj.trip_request:
            await supabase_service.save_trip_request(session_id, profile_obj.trip_request.model_dump())
        await supabase_service.save_trip_profile(session_id, profile_obj.model_dump())

        # Execute LangGraph planning workflow
        plan_response = await planning_service.create_travel_plan(profile_obj, session_id=session_id)
        plan_response.session_id = session_id

        # Persist all intelligence artifacts
        sb_saves = []
        if plan_response.weather_context:
            logger.info("[SESSION] Saving weather: %s", session_id)
            sb_saves.append(await supabase_service.save_weather_result(session_id, plan_response.weather_context.model_dump()))
        if plan_response.places_context:
            logger.info("[SESSION] Saving places: %s", session_id)
            places_dict = plan_response.places_context.model_dump()
            if plan_response.ranked_attractions:
                places_dict["ranked_attractions"] = [r.model_dump() for r in plan_response.ranked_attractions]
            sb_saves.append(await supabase_service.save_places_result(session_id, places_dict))
        if plan_response.hotel_context:
            logger.info("[SESSION] Saving hotels: %s", session_id)
            hotel_dict = plan_response.hotel_context.model_dump()
            if plan_response.ranked_hotels:
                hotel_dict["ranked_hotels"] = [h.model_dump() for h in plan_response.ranked_hotels]
            sb_saves.append(await supabase_service.save_hotel_result(session_id, hotel_dict))
        if plan_response.transportation_context:
            logger.info("[SESSION] Saving transportation: %s", session_id)
            sb_saves.append(await supabase_service.save_transportation_result(
                session_id, plan_response.transportation_context.model_dump()
            ))
        if plan_response.food_context:
            logger.info("[SESSION] Saving food: %s", session_id)
            sb_saves.append(await supabase_service.save_food_result(
                session_id, plan_response.food_context.model_dump()
            ))
        if plan_response.itinerary_context:
            logger.info("[SESSION] Saving itinerary: %s", session_id)
            sb_saves.append(await supabase_service.save_itinerary_result(
                session_id, plan_response.itinerary_context.model_dump()
            ))

        await supabase_service.update_session_status(session_id, "completed")

        plan_response.persistence = supabase_service.get_persistence_status(session_id)

        return plan_response

    except ValidationError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err)
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(val_err)
        )
    except Exception as e:
        logger.error(f"Planning workflow failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LangGraph autonomous planning failed: {str(e)}"
        )

# ================================================================
# PHASE 7: SUPABASE PERSISTENCE & ACCOMMODATION ENDPOINTS
# ================================================================

@router.post(
    "/trips",
    status_code=status.HTTP_201_CREATED,
    summary="Create full planning session and execute autonomous trip plan",
    description="Phase 7: Initializes a cloud database session in Supabase, saves user inputs, synthesizes travel profile, runs LangGraph agent with real Weather, Places, and Hotel intelligence, and saves all outputs."
)
async def create_full_trip(trip_data: TripCreate):
    try:
        result = await planning_session_service.create_and_run_planning(trip_data)
        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as e:
        logger.error(f"Full trip planning failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Trip planning session failed: {str(e)}"
        )

@router.get(
    "/trips",
    status_code=status.HTTP_200_OK,
    summary="Retrieve saved trip planning sessions",
    description="Phase 7: Retrieves list of previously created trip planning sessions from Supabase cloud database."
)
async def get_saved_trips():
    try:
        sessions = await planning_session_service.list_saved_sessions()
        return {"trips": sessions, "total": len(sessions)}
    except Exception as e:
        logger.error(f"Error fetching saved trips: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve saved trips."
        )

@router.get(
    "/trips/{session_id}",
    status_code=status.HTTP_200_OK,
    summary="Retrieve complete saved trip planning session",
    description="Phase 7: Retrieves complete structured trip data (request, profile, weather, places, hotels, transportation, food, itinerary) for a specific session ID."
)
@router.get(
    "/session/{session_id}",
    status_code=status.HTTP_200_OK,
    summary="Retrieve complete saved trip planning session (Alias)",
    description="Alias endpoint for session restoration and dashboard reconstruction."
)
@router.get(
    "/planning-session/{session_id}",
    status_code=status.HTTP_200_OK,
    summary="Retrieve complete saved trip planning session (Planning-Session Alias)",
    description="Alias endpoint for session restoration."
)
async def get_saved_trip_by_id(session_id: str):
    try:
        session_data = await planning_session_service.get_saved_session(session_id)
        if not session_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Trip planning session '{session_id}' not found."
            )
        return session_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching trip session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve trip session details."
        )

from app.schemas.copilot import TripChatRequest, TripChatResponse
from app.services.copilot_service import copilot_service
from app.schemas.packing import PackingRequest, PackingResponse
from app.services.packing_service import packing_service

@router.post(
    "/chat",
    response_model=TripChatResponse,
    status_code=status.HTTP_200_OK,
    summary="AI Trip Co-Pilot Concierge",
    description="Interactive in-trip assistant answering packing, dining, pacing, and customization questions."
)
async def chat_with_copilot(req: TripChatRequest):
    try:
        return await copilot_service.chat(req)
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post(
    "/packing",
    response_model=PackingResponse,
    status_code=status.HTTP_200_OK,
    summary="AI Weather-Aware Packing & Travel Readiness Checklist",
    description="Generates dynamic, weather-aware packing items categorized with advisories."
)
async def get_packing_checklist(req: PackingRequest):
    try:
        return await packing_service.generate_packing_checklist(req)
    except Exception as e:
        logger.error(f"Error generating packing checklist: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Packing checklist generation failed: {str(e)}"
        )

from app.schemas.budget import BudgetPlanRequest, BudgetPlanResponse
from app.services.budget_service import budget_service

@router.post(
    "/budget/allocation",
    response_model=BudgetPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Smart Destination Budget Allocation & Multi-Currency Converter",
    description="Calculates realistic itemized budget allocation (Stay, Food, Transit, Entry fees, Buffer) and currency matrix."
)
async def get_budget_allocation(req: BudgetPlanRequest):
    try:
        return await budget_service.calculate_budget_allocation(req)
    except Exception as e:
        logger.error(f"Error calculating budget allocation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Budget calculation failed: {str(e)}"
        )


