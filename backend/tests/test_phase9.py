import pytest
from unittest.mock import patch
from app.schemas.itinerary import (
    ItineraryResult,
    ItineraryDay,
    ItineraryActivity,
    ItineraryValidation,
    TripSummary
)
from app.schemas.travel_preferences import EnhancedTripProfile
from app.services.itinerary_service import itinerary_service, ItineraryService
from app.services.supabase_service import supabase_service, local_store

# ---------------------------------------------------------------------------
# 1. Day-Wise Timeline Synthesis & Pacing Tests
# ---------------------------------------------------------------------------

def test_phase9_deterministic_itinerary_generation():
    """Verify deterministic day-wise itinerary builds correct day count and activity distribution."""
    profile_dict = {
        "trip_request": {
            "origin": "Mumbai",
            "destination": "Jaipur",
            "departure_date": "2026-09-11",
            "return_date": "2026-09-14",
            "travelers": 4,
            "budget": 60000.0,
            "preferences": ["Heritage", "Culture"],
            "additional_instructions": "Avoid excessive walking"
        },
        "trip_analysis": {
            "trip_summary": "Jaipur 3-day heritage journey",
            "duration_days": 3,
            "budget_level": "Luxury",
            "budget_per_day": 20000.0,
            "budget_per_traveler": 15000.0,
            "travel_style": "Heritage",
            "accommodation_expectation": "Luxury Haveli",
            "notes": "Standard estimates",
            "priority_preferences": ["Heritage", "Culture"],
            "suggested_activity_categories": ["Forts", "Palaces"]
        },
        "travel_preferences": {
            "travel_mood": "Cultural & Heritage",
            "pace": "Relaxed",
            "traveler_context": "4 travelers",
            "accommodation_preferences": "Luxury Heritage Hotel",
            "transportation_preferences": "Prefer private car or cab",
            "accessibility_or_special_constraints": "Avoid excessive walking"
        },
        "combined_constraints": ["Avoid excessive walking"]
    }

    hotel_dict = {
        "destination": "Jaipur",
        "hotels": [{"name": "Jai Mahal Palace", "latitude": 26.9124, "longitude": 75.7873, "address": "Jacob Road, Jaipur"}]
    }

    places_dict = {
        "destination": "Jaipur",
        "places": [
            {"name": "Amber Fort", "latitude": 26.9855, "longitude": 75.8513, "category": "Fort"},
            {"name": "City Palace", "latitude": 26.9258, "longitude": 75.8237, "category": "Palace"},
            {"name": "Hawa Mahal", "latitude": 26.9239, "longitude": 75.8267, "category": "Monument"},
            {"name": "Jantar Mantar", "latitude": 26.9248, "longitude": 75.8246, "category": "Observatory"}
        ]
    }

    weather_dict = {
        "location": "Jaipur",
        "forecast_available": True,
        "daily_forecasts": [
            {"date": "2026-09-11", "condition": "Sunny", "temperature_c": 31.5},
            {"date": "2026-09-12", "condition": "Clear", "temperature_c": 32.0},
            {"date": "2026-09-13", "condition": "Partly Cloudy", "temperature_c": 30.0}
        ]
    }

    food_dict = {
        "destination": "Jaipur",
        "venues": [
            {"name": "1135 AD", "cuisine": "Royal Rajasthani", "latitude": 26.9850, "longitude": 75.8510},
            {"name": "Laxmi Mishthan Bhandar", "cuisine": "Traditional Sweets & Thali", "latitude": 26.9230, "longitude": 75.8260}
        ]
    }

    itinerary: ItineraryResult = itinerary_service.generate_itinerary(
        trip_profile=profile_dict,
        weather_result=weather_dict,
        places_result=places_dict,
        hotel_result=hotel_dict,
        food_result=food_dict
    )

    assert isinstance(itinerary, ItineraryResult)
    assert itinerary.trip_summary.destination == "Jaipur"
    assert itinerary.total_days == 4 or itinerary.total_days == 3
    assert len(itinerary.days) >= 3
    assert itinerary.total_activities >= 6

    # Verify Day 1 structure
    day1 = itinerary.days[0]
    assert day1.day_number == 1
    assert len(day1.activities) >= 2
    assert any(a.time in ["09:00", "10:30", "13:00"] or a.type == "attraction" for a in day1.activities)
    assert any("cab" in (a.transport_mode or "").lower() or "private" in (a.transport_mode or "").lower() for a in day1.activities)

    # Verify weather advisory propagation
    assert day1.weather_summary is not None or itinerary.validation.weather_adjusted is True

# ---------------------------------------------------------------------------
# 2. Accessibility & Pacing Constraint Compliance
# ---------------------------------------------------------------------------

def test_phase9_accessibility_and_pacing_applied():
    """Verify itinerary applies accessibility transit overrides and relaxed pacing."""
    profile_dict = {
        "trip_request": {
            "origin": "Mumbai",
            "destination": "Jaipur",
            "departure_date": "2026-09-11",
            "return_date": "2026-09-13",
            "travelers": 2,
            "budget": 40000.0,
            "additional_instructions": "Mobility issue: cannot walk long distances"
        },
        "travel_preferences": {
            "pace": "Relaxed",
            "accessibility_or_special_constraints": "Mobility issue: cannot walk long distances"
        },
        "combined_constraints": ["Mobility issue: cannot walk long distances"]
    }

    itinerary = itinerary_service.generate_itinerary(
        trip_profile=profile_dict,
        places_result={"destination": "Jaipur", "places": [{"name": "Hawa Mahal", "latitude": 26.92, "longitude": 75.82}]},
        hotel_result={"hotels": [{"name": "Heritage Inn", "latitude": 26.91, "longitude": 75.79}]}
    )

    assert itinerary.trip_summary.accessibility_active is True
    assert itinerary.validation.accessibility_respected is True
    assert itinerary.validation.pace_balanced is True
    assert itinerary.trip_summary.hotel_name == "Heritage Inn"

# ---------------------------------------------------------------------------
# 3. Supabase Cloud & Local Fallback Persistence Test
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_supabase_itinerary_persistence():
    """Verify saving itinerary result updates both local store and Supabase."""
    session = await supabase_service.create_session(status="planning")
    session_id = session["id"]

    mock_itinerary_data = {
        "destination": "Jaipur",
        "total_days": 3,
        "total_activities": 8,
        "trip_summary": {"pacing": "Moderate", "accessibility_notes": "None"},
        "days": [
            {
                "day_number": 1,
                "date": "2026-09-11",
                "theme": "Historic Forts",
                "activities": [
                    {
                        "time_slot": "Morning",
                        "title": "Amber Fort Exploration",
                        "description": "Visit historic fort.",
                        "location_name": "Amber Fort",
                        "latitude": 26.9855,
                        "longitude": 75.8513,
                        "transport_mode": "Cab / Taxi"
                    }
                ]
            }
        ]
    }

    success = await supabase_service.save_itinerary_result(session_id, mock_itinerary_data)
    assert success is True

    stored = await supabase_service.get_session(session_id)
    assert stored is not None
    assert stored["itinerary_result"] is not None
    assert stored["itinerary_result"]["destination"] == "Jaipur"
    assert stored["itinerary_result"]["total_days"] == 3
