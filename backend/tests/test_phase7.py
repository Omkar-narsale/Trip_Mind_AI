import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.hotel import Hotel, RankedHotel, HotelResult
from app.schemas.trip import TripCreate
from app.schemas.travel_preferences import EnhancedTripProfile
from app.schemas.trip_analysis import TripAnalysis
from app.services.hotel_service import (
    categorize_accommodation_type,
    extract_address,
    extract_rating,
    extract_booking_url,
    hotel_service
)
from app.services.hotel_ranker import build_heuristic_hotel_ranking, hotel_ranker
from app.services.supabase_service import supabase_service, local_store

client = TestClient(app)

# ---------------------------------------------------------------------------
# 1. Hotel Tag Parsing & Normalization Tests
# ---------------------------------------------------------------------------

def test_categorize_accommodation_type():
    assert categorize_accommodation_type({"tourism": "hotel"}) == "Hotel"
    assert categorize_accommodation_type({"tourism": "hostel"}) == "Hostel"
    assert categorize_accommodation_type({"tourism": "guest_house"}) == "Guest House / B&B"
    assert categorize_accommodation_type({"tourism": "resort"}) == "Resort"
    assert categorize_accommodation_type({"tourism": "motel"}) == "Motel"
    assert categorize_accommodation_type({"tourism": "apartment"}) == "Apartment / Suite"
    assert categorize_accommodation_type({"tourism": "hotel", "hotel_type": "boutique"}) == "Boutique Hotel"

def test_extract_address():
    tags = {
        "addr:street": "Main Boulevard",
        "addr:housenumber": "42",
        "addr:city": "Jaipur"
    }
    addr = extract_address(tags)
    assert "42 Main Boulevard" in addr
    assert "Jaipur" in addr

    # Fallback to display name
    tags_empty = {}
    display = "Hotel Royal, Palace Road, Jaipur, Rajasthan, India"
    assert "Palace Road" in extract_address(tags_empty, display)

def test_extract_rating():
    assert extract_rating({"stars": "4"}) == 4.0
    assert extract_rating({"stars:osm": "4.5"}) == 4.5
    assert extract_rating({"stars": "5 stars"}) == 5.0
    assert extract_rating({}) is None

def test_extract_booking_url():
    assert extract_booking_url({"contact:website": "https://royalhotel.com"}) == "https://royalhotel.com"
    assert extract_booking_url({"website": "http://palaceinn.com"}) == "http://palaceinn.com"
    assert extract_booking_url({}) is None

# ---------------------------------------------------------------------------
# 2. Hotel Schema Validation
# ---------------------------------------------------------------------------

def test_hotel_schema_validation():
    hotel = Hotel(
        hotel_id="osm_node_1001",
        name="The Heritage Palace",
        latitude=26.9124,
        longitude=75.7873,
        address="12 City Palace Road, Jaipur",
        rating=4.5,
        accommodation_type="Hotel",
        distance_km=1.2
    )
    assert hotel.name == "The Heritage Palace"
    assert hotel.price is None  # Honest: no invented pricing
    assert hotel.review_count is None
    assert hotel.source == "OpenStreetMap / Overpass API"

# ---------------------------------------------------------------------------
# 3. Hotel Heuristic Ranking Tests
# ---------------------------------------------------------------------------

def test_hotel_heuristic_ranking():
    hotel1 = Hotel(
        hotel_id="osm_node_1",
        name="Backpacker Central Hostel",
        latitude=26.91,
        longitude=75.78,
        accommodation_type="Hostel",
        distance_km=1.5
    )
    hotel2 = Hotel(
        hotel_id="osm_node_2",
        name="Grand Luxury Resort & Spa",
        latitude=26.85,
        longitude=75.72,
        accommodation_type="Resort",
        distance_km=9.0
    )

    trip_req = TripCreate(
        origin="Delhi",
        destination="Jaipur",
        departure_date="2026-10-01",
        return_date="2026-10-05",
        travelers=1,
        budget=300,
        preferences=["History", "Culture"]
    )
    trip_analysis = TripAnalysis(
        destination="Jaipur",
        origin="Delhi",
        duration_days=5,
        budget_level="Budget",
        budget_per_day=60,
        budget_per_traveler=300,
        travel_style="Budget Backpacker",
        accommodation_expectation="Budget / Hostel",
        travel_pace="Moderate",
        trip_summary="Solo budget cultural trip to Jaipur",
        trip_readiness_score=85,
        readiness_level="High",
        top_recommendations=["Stay in central hostel", "Use public transit"],
        notes="Budget backpacker journey"
    )
    profile = EnhancedTripProfile(
        trip_request=trip_req,
        trip_analysis=trip_analysis
    )

    ranked = build_heuristic_hotel_ranking([hotel1, hotel2], profile)
    assert len(ranked) == 2
    # For a budget solo traveler, hostel should rank higher than far-away luxury resort
    assert ranked[0].hotel.hotel_id == "osm_node_1"
    assert ranked[0].relevance_score > ranked[1].relevance_score
    assert "Budget-Friendly Stays" in ranked[0].matched_preferences

# ---------------------------------------------------------------------------
# 4. Supabase Service & Local Store Fallback Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_supabase_service_lifecycle_fallback():
    # Test session creation
    session = await supabase_service.create_session(status="created")
    session_id = session["id"]
    assert session_id is not None
    assert session["status"] == "created"

    # Test saving trip request
    req_saved = await supabase_service.save_trip_request(session_id, {
        "origin": "Delhi",
        "destination": "Jaipur",
        "departure_date": "2026-10-01",
        "return_date": "2026-10-05",
        "travelers": 2,
        "budget": 1200
    })
    assert req_saved is True

    # Test saving hotel result
    hotel_saved = await supabase_service.save_hotel_result(session_id, {
        "destination": "Jaipur",
        "total_found": 5,
        "source_status": "success"
    })
    assert hotel_saved is True

    # Test status update
    updated = await supabase_service.update_session_status(session_id, "completed")
    assert updated is True

    # Test retrieval
    session_data = await supabase_service.get_session(session_id)
    assert session_data is not None
    assert session_data["session"]["status"] == "completed"
    assert session_data["trip_request"]["destination"] == "Jaipur"
    assert session_data["hotel_result"]["total_found"] == 5

    # Test list
    sessions_list = await supabase_service.list_sessions()
    assert any(s["id"] == session_id for s in sessions_list)

# ---------------------------------------------------------------------------
# 5. API Endpoints Tests
# ---------------------------------------------------------------------------

def test_api_get_saved_trips():
    response = client.get("/api/trips")
    assert response.status_code == 200
    data = response.json()
    assert "trips" in data
    assert isinstance(data["trips"], list)

def test_api_get_saved_trip_not_found():
    response = client.get("/api/trips/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
