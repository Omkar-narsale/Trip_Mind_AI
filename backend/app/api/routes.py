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

@router.post(
    "/trip/plan",
    response_model=TravelPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute LangGraph Autonomous Travel Planning Agent",
    description="Phase 4: Decomposes the EnhancedTripProfile into dependency-aware planning tasks and executes workflow simulation."
)
async def plan_trip(payload: Union[EnhancedTripProfile, Dict[str, Any]] = Body(...)):
    try:
        # Handle wrapped or direct EnhancedTripProfile
        if isinstance(payload, dict) and "profile" in payload:
            profile_obj = EnhancedTripProfile(**payload["profile"])
        elif isinstance(payload, dict):
            profile_obj = EnhancedTripProfile(**payload)
        else:
            profile_obj = payload

        plan_response = await planning_service.create_travel_plan(profile_obj)
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
