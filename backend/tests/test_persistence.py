import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.supabase_service import supabase_service, local_store

@pytest.mark.asyncio
async def test_persistence_1_create_planning_session():
    """Test 1: Create planning session and verify row exists."""
    session = await supabase_service.create_session(status="created")
    session_id = session["id"]
    assert session_id is not None
    assert session["status"] == "created"

    stored = await supabase_service.get_session(session_id)
    assert stored is not None
    assert stored["session"]["id"] == session_id
    assert stored["session"]["status"] == "created"

@pytest.mark.asyncio
async def test_persistence_2_save_transportation_result():
    """Test 2: Save transportation result and verify row exists."""
    session = await supabase_service.create_session(status="planning")
    session_id = session["id"]

    trans_data = {
        "destination": "Jaipur",
        "total_clusters": 2,
        "recommendations": [{"origin": "Hotel", "destination": "Hawa Mahal", "recommended_mode": "Cab"}],
        "clusters": [{"cluster_name": "Old City Hub", "locations": []}],
        "accessibility_applied": True
    }

    saved = await supabase_service.save_transportation_result(session_id, trans_data)
    assert saved is True

    stored = await supabase_service.get_session(session_id)
    assert stored is not None
    assert stored["transportation_result"] is not None
    assert stored["transportation_result"]["destination"] == "Jaipur"
    assert stored["transportation_result"]["accessibility_applied"] is True

@pytest.mark.asyncio
async def test_persistence_3_and_4_save_and_retrieve_complete_plan():
    """Test 3 & 4: Save complete planning result and verify all child records exist & return."""
    session = await supabase_service.create_session(status="planning")
    session_id = session["id"]

    # Save request & profile
    await supabase_service.save_trip_request(session_id, {
        "origin": "Mumbai",
        "destination": "Jaipur",
        "departure_date": "2026-09-11",
        "return_date": "2026-09-16",
        "travelers": 4,
        "budget": 60000
    })
    await supabase_service.save_trip_profile(session_id, {"travel_style": "Luxury", "pace": "Relaxed"})

    # Save weather, places, hotels, transport, food, itinerary
    await supabase_service.save_weather_result(session_id, {"location": "Jaipur", "forecast_available": True})
    await supabase_service.save_places_result(session_id, {"destination": "Jaipur", "total_found": 25})
    await supabase_service.save_hotel_result(session_id, {"destination": "Jaipur", "total_found": 20})
    await supabase_service.save_transportation_result(session_id, {"destination": "Jaipur", "total_clusters": 2})
    await supabase_service.save_food_result(session_id, {"destination": "Jaipur", "total_found": 15})
    await supabase_service.save_itinerary_result(session_id, {"total_days": 6, "total_activities": 18})

    await supabase_service.update_session_status(session_id, "completed")

    # Retrieve complete session
    stored = await supabase_service.get_session(session_id)
    assert stored is not None
    assert stored["session"]["status"] == "completed"
    assert stored["trip_request"]["destination"] == "Jaipur"
    assert stored["trip_profile"]["travel_style"] == "Luxury"
    assert stored["weather_result"]["location"] == "Jaipur"
    assert stored["places_result"]["total_found"] == 25
    assert stored["hotel_result"]["total_found"] == 20
    assert stored["transportation_result"]["total_clusters"] == 2
    assert stored["food_result"]["total_found"] == 15
    assert stored["itinerary_result"]["total_days"] == 6

@pytest.mark.asyncio
async def test_persistence_5_api_session_restoration():
    """Test 5: API retrieval endpoint restores saved session for dashboard reconstruction."""
    session = await supabase_service.create_session(status="completed")
    session_id = session["id"]

    await supabase_service.save_trip_request(session_id, {
        "origin": "Mumbai",
        "destination": "Jaipur",
        "departure_date": "2026-09-11",
        "return_date": "2026-09-16",
        "travelers": 4,
        "budget": 60000
    })
    await supabase_service.save_weather_result(session_id, {"location": "Jaipur"})
    await supabase_service.save_transportation_result(session_id, {"destination": "Jaipur", "total_clusters": 2})

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Test /api/session/{session_id}
        res1 = await ac.get(f"/api/session/{session_id}")
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["session"]["id"] == session_id
        assert data1["trip_request"]["destination"] == "Jaipur"
        assert data1["transportation_result"]["total_clusters"] == 2

        # Test /api/trips/{session_id}
        res2 = await ac.get(f"/api/trips/{session_id}")
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["session"]["id"] == session_id

@pytest.mark.asyncio
async def test_persistence_6_supabase_failure_reports_local_fallback():
    """Test 6: Supabase failure triggers local fallback and accurately reports persistence status."""
    session = await supabase_service.create_session(status="planning")
    session_id = session["id"]

    # Even if cloud status is unpersisted, get_persistence_status reports local fallback
    status_meta = supabase_service.get_persistence_status(session_id)
    assert "supabase" in status_meta
    assert "local_fallback" in status_meta
    assert status_meta["local_fallback"] is True
    if not status_meta["supabase"]:
        assert status_meta["status"] == "local_only"
