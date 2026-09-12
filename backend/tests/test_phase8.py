import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.transportation import (
    LocationType,
    TransportationMode,
    LocationPoint,
    LocationCluster,
    TransportationRecommendation,
    TransportationResult
)
from app.schemas.places import RankedAttraction
from app.schemas.hotel import RankedHotel
from app.schemas.trip import TripCreate
from app.schemas.travel_preferences import EnhancedTripProfile, ExtractedTravelPreferences
from app.schemas.trip_analysis import TripAnalysis
from app.tools.transportation_tool import (
    calculate_haversine,
    extract_location_points,
    cluster_attractions
)
from app.services.transportation_service import (
    detect_accessibility_constraints,
    build_heuristic_transportation_plan,
    transportation_service
)
from app.services.supabase_service import supabase_service, local_store

client = TestClient(app)

# ---------------------------------------------------------------------------
# 1. Haversine Deterministic Formula Tests
# ---------------------------------------------------------------------------

def test_haversine_zero_distance():
    lat, lon = 26.9124, 75.7873
    assert calculate_haversine(lat, lon, lat, lon) == 0.0

def test_haversine_symmetry():
    lat1, lon1 = 26.9124, 75.7873
    lat2 = 26.9855
    lon2 = 75.8513
    d1 = calculate_haversine(lat1, lon1, lat2, lon2)
    d2 = calculate_haversine(lat2, lon2, lat1, lon1)
    assert abs(d1 - d2) < 1e-9
    assert d1 > 0

def test_haversine_known_benchmark():
    # London (51.5074, -0.1278) to Paris (48.8566, 2.3522) ~ 343 km
    dist = calculate_haversine(51.5074, -0.1278, 48.8566, 2.3522)
    assert 340.0 <= dist <= 346.0

def test_haversine_clamping():
    # Outside normal bounds should be safely clamped without throwing exceptions
    dist = calculate_haversine(95.0, 190.0, -95.0, -190.0)
    assert dist > 0

# ---------------------------------------------------------------------------
# 2. Attraction Geographic Clustering Tests
# ---------------------------------------------------------------------------

def test_cluster_attractions_proximity():
    # Two central sights within 1 km of each other
    attr1 = LocationPoint(name="Hawa Mahal", location_type=LocationType.ATTRACTION, latitude=26.9239, longitude=75.8267)
    attr2 = LocationPoint(name="City Palace", location_type=LocationType.ATTRACTION, latitude=26.9258, longitude=75.8237)
    # One far sight 11 km away
    attr3 = LocationPoint(name="Amber Fort", location_type=LocationType.ATTRACTION, latitude=26.9855, longitude=75.8513)

    clusters = cluster_attractions([attr1, attr2, attr3], threshold_km=3.0)

    # Expect 2 clusters: Central Hub (Hawa Mahal + City Palace) and Amber Fort Hub
    assert len(clusters) == 2
    central_cluster = next(c for c in clusters if "Hawa Mahal" in c.attraction_names)
    assert "City Palace" in central_cluster.attraction_names
    assert len(central_cluster.attraction_names) == 2

    amber_cluster = next(c for c in clusters if "Amber Fort" in c.attraction_names)
    assert len(amber_cluster.attraction_names) == 1

# ---------------------------------------------------------------------------
# 3. Accessibility & Constraint Overrides Tests
# ---------------------------------------------------------------------------

def test_detect_accessibility_constraints_active():
    trip_req = TripCreate(
        origin="New Delhi",
        destination="Jaipur",
        departure_date="2026-10-01",
        return_date="2026-10-05",
        travelers=2,
        budget=1200,
        traveler_context="Traveling with elderly parent"
    )
    prefs = ExtractedTravelPreferences(
        accessibility_or_special_constraints="Please avoid excessive walking due to knee pain"
    )
    profile = EnhancedTripProfile(
        trip_request=trip_req,
        trip_analysis=TripAnalysis(
            trip_summary="Jaipur cultural exploration trip",
            duration_days=4,
            budget_level="Moderate",
            budget_per_day=300.0,
            budget_per_traveler=600.0,
            travel_style="Comfortable",
            accommodation_expectation="Comfortable hotel",
            notes="Standard estimates"
        ),
        travel_preferences=prefs,
        combined_constraints=["Please avoid excessive walking due to knee pain"]
    )

    applied, details = detect_accessibility_constraints(profile)
    assert applied is True
    assert "walking" in details.lower() or "elderly" in details.lower()

def test_heuristic_transportation_accessibility_override():
    trip_req = TripCreate(
        origin="New Delhi",
        destination="Jaipur",
        departure_date="2026-10-01",
        return_date="2026-10-05",
        travelers=2,
        budget=1200
    )
    profile = EnhancedTripProfile(
        trip_request=trip_req,
        trip_analysis=TripAnalysis(
            trip_summary="Jaipur cultural trip",
            duration_days=4,
            budget_level="Moderate",
            budget_per_day=300.0,
            budget_per_traveler=600.0,
            travel_style="Comfortable",
            accommodation_expectation="Comfortable hotel",
            notes="Standard estimates"
        )
    )

    hotel_point = LocationPoint(name="Hotel Royal", location_type=LocationType.HOTEL, latitude=26.91, longitude=75.78)
    loc_point = LocationPoint(name="City Palace", location_type=LocationType.ATTRACTION, latitude=26.92, longitude=75.79)
    cluster = LocationCluster(
        cluster_id="cluster_1",
        cluster_name="City Center Hub",
        locations=[loc_point],
        center_lat=26.92,
        center_lon=75.79,
        approximate_span_km=1.0,
        proximity_note="Central sights"
    )
    segments = [{
        "from": "Hotel Royal",
        "to": "City Center Hub",
        "distance_km": 1.1  # 1.1 km
    }]

    # Without accessibility constraint: 1.1 km is WALKING
    res_normal = build_heuristic_transportation_plan(
        destination="Jaipur",
        hotel_point=hotel_point,
        clusters=[cluster],
        segments=segments,
        profile=profile,
        accessibility_applied=False,
        accessibility_notes=None
    )
    assert res_normal.recommendations[0].recommended_mode == TransportationMode.WALKING

    # With accessibility constraint: 1.1 km (> 0.5 km) overrides to CAB_TAXI
    res_accessible = build_heuristic_transportation_plan(
        destination="Jaipur",
        hotel_point=hotel_point,
        clusters=[cluster],
        segments=segments,
        profile=profile,
        accessibility_applied=True,
        accessibility_notes="Mobility limitation"
    )
    assert res_accessible.recommendations[0].recommended_mode == TransportationMode.CAB_TAXI
    assert res_accessible.accessibility_applied is True

# ---------------------------------------------------------------------------
# 4. Transportation Service Fallback Execution
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_transportation_service_graceful_fallback():
    dest = "Jaipur"
    hotel_dict = {
        "name": "Heritage Haveli",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "address": "Old City, Jaipur"
    }
    attractions = [
        {"name": "Hawa Mahal", "latitude": 26.9239, "longitude": 75.8267},
        {"name": "Amber Fort", "latitude": 26.9855, "longitude": 75.8513}
    ]

    # Force Groq LLM failure to test deterministic fallback
    with patch("app.services.transportation_service.get_llm", side_effect=RuntimeError("Groq offline")):
        res = await transportation_service.generate_transportation_plan(
            destination=dest,
            hotel=hotel_dict,
            attractions=attractions
        )

        assert isinstance(res, TransportationResult)
        assert res.destination == dest
        assert res.total_clusters >= 1
        assert len(res.recommendations) >= 1
        assert "approximate straight-line" in res.data_honesty_disclaimer.lower()

# ---------------------------------------------------------------------------
# 5. Cloud Database & Local Fallback Persistence Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_supabase_transportation_persistence():
    session = local_store.create_session("created")
    session_id = session["id"]

    mock_trans_data = {
        "destination": "Jaipur",
        "total_clusters": 2,
        "summary": "Jaipur route optimization generated.",
        "clusters": [],
        "recommendations": [],
        "route_optimization_insights": ["Visit central sights together."]
    }

    success = await supabase_service.save_transportation_result(session_id, mock_trans_data)
    assert success is True

    stored = await supabase_service.get_session(session_id)
    assert stored is not None
    assert stored["transportation_result"] is not None
    assert stored["transportation_result"]["destination"] == "Jaipur"

# ---------------------------------------------------------------------------
# 6. Full End-to-End API Integration
# ---------------------------------------------------------------------------

def test_api_plan_trip_includes_transportation():
    payload = {
        "trip_request": {
            "origin": "New Delhi",
            "destination": "Jaipur",
            "departure_date": "2026-10-15",
            "return_date": "2026-10-18",
            "travelers": 2,
            "budget": 1000.0,
            "preferences": ["Heritage", "Culture"],
            "additional_instructions": "Prefer cabs over long walks"
        },
        "trip_analysis": {
            "trip_summary": "Jaipur 3-day exploration",
            "duration_days": 3,
            "budget_level": "Moderate",
            "budget_per_day": 333.0,
            "budget_per_traveler": 500.0,
            "travel_style": "Cultural",
            "accommodation_expectation": "Comfortable hotel",
            "notes": "Standard estimates",
            "priority_preferences": ["Heritage", "Culture"],
            "suggested_activity_categories": ["Forts", "Palaces"]
        },
        "travel_preferences": {
            "travel_mood": "Cultural exploration",
            "pace": "Moderate",
            "traveler_context": "2 travelers",
            "accommodation_preferences": "Comfortable hotel",
            "transportation_preferences": "Prefer cabs over long walks",
            "accessibility_or_special_constraints": "Prefer cabs over long walks"
        },
        "combined_constraints": ["Prefer cabs over long walks"]
    }

    response = client.post("/api/trip/plan", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data.get("success") is True
    assert "transportation_context" in data
    trans = data["transportation_context"]
    if trans:
        assert "clusters" in trans
        assert "recommendations" in trans
        assert "route_optimization_insights" in trans
        assert "approximate straight-line" in trans["data_honesty_disclaimer"].lower()
