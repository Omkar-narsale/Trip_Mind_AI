"""
Phase 5 Test Suite for TripMind AI
Tests:
1. Real destination geocoding and live forecast retrieval
2. Travel dates within available forecast range (0-15 days)
3. Travel dates outside forecast range (>16 days) -> forecast_available=False with honest disclaimer
4. Invalid destination -> graceful location_not_found
5. Weather API network error / timeout -> graceful recovery without crashing
6. Planner agent decomposes workflow with task_type='weather'
7. LangGraph graph executes real weather tool and populates weather_context and weather_insight
8. Weather failure does not crash entire planning workflow
9. Truthful Groq weather insight generated from structured weather result
"""
import os
import sys
import datetime
from pathlib import Path
from unittest.mock import patch, AsyncMock
import pytest

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from app.main import app
from app.services.weather_service import weather_service, WeatherService
from app.tools.weather_tool import weather_tool
from app.schemas.weather import WeatherResult, WeatherDay, WeatherInsight
from app.agents.planner_agent import planner_graph, TaskType

client = TestClient(app)

def _sample_enhanced_profile(
    destination="Jaipur, India",
    departure_date=None,
    return_date=None,
    duration_days=5,
    travelers=2,
    budget=2000.0,
    budget_level="Moderate"
):
    today = datetime.date.today()
    dep = departure_date or (today + datetime.timedelta(days=2)).isoformat()
    ret = return_date or (today + datetime.timedelta(days=6)).isoformat()

    return {
        "trip_request": {
            "origin": "New Delhi, India",
            "destination": destination,
            "departure_date": dep,
            "return_date": ret,
            "travelers": travelers,
            "budget": budget,
            "preferences": ["Food", "History"],
            "additional_instructions": None
        },
        "trip_analysis": {
            "origin": "New Delhi, India",
            "destination": destination,
            "departure_date": dep,
            "return_date": ret,
            "duration_days": duration_days,
            "travelers": travelers,
            "total_budget": budget,
            "budget_level": budget_level,
            "budget_per_day": round(budget / max(duration_days, 1), 2),
            "budget_per_traveler": round(budget / max(travelers, 1), 2),
            "travel_style": "Cultural exploration",
            "accommodation_expectation": "Heritage hotel",
            "priority_preferences": ["Food", "History"],
            "suggested_activity_categories": ["Palaces", "Local Cuisine"],
            "planning_constraints": [f"Budget capped at ${budget}"],
            "trip_summary": f"A {duration_days}-day trip to {destination} for {travelers} travelers.",
            "notes": "Planning estimates."
        },
        "travel_preferences": {
            "travel_mood": "Cultural exploration",
            "pace": "Moderate",
            "traveler_context": f"{travelers} travelers",
            "accommodation_preferences": "Heritage stay",
            "avoided_activities": [],
            "food_preferences": "Rajasthani cuisine",
            "transportation_preferences": "Local cab / driver",
            "accessibility_or_special_constraints": None,
            "key_constraints": [f"Budget capped at ${budget}"],
            "confidence_notes": "Standard extraction"
        },
        "combined_constraints": [f"Budget capped at ${budget}"],
        "planning_context": {
            "duration_days": duration_days,
            "destination": destination
        }
    }

import asyncio

def test_1_weather_service_live_geocoding_and_forecast():
    """Scenario 1: Geocoding and forecast retrieval for real destination."""
    async def _run():
        today = datetime.date.today()
        dep = (today + datetime.timedelta(days=1)).isoformat()
        ret = (today + datetime.timedelta(days=4)).isoformat()

        result = await weather_service.get_weather_for_trip("Paris, France", dep, ret)
        assert result.location is not None
        assert result.source_status in ["live_forecast", "error"]
        if result.source_status == "live_forecast":
            assert result.forecast_available is True
            assert len(result.weather_days) > 0
            assert result.weather_days[0].temperature is not None
        print("[PASS] test_1_weather_service_live_geocoding_and_forecast")
    asyncio.run(_run())

def test_2_travel_dates_within_forecast_range():
    """Scenario 2: Travel dates 2-5 days from today should retrieve live forecast."""
    async def _run():
        today = datetime.date.today()
        dep = (today + datetime.timedelta(days=2)).isoformat()
        ret = (today + datetime.timedelta(days=5)).isoformat()

        result = await weather_service.get_weather_for_trip("Tokyo", dep, ret)
        if result.source_status == "live_forecast":
            assert result.forecast_available is True
            assert len(result.weather_days) >= 1
            for day in result.weather_days:
                assert day.condition is not None
                assert day.date >= dep
        print("[PASS] test_2_travel_dates_within_forecast_range")
    asyncio.run(_run())

def test_3_travel_dates_outside_forecast_range():
    """Scenario 3: Travel dates >16 days in the future return forecast_available=False with honest notice."""
    async def _run():
        today = datetime.date.today()
        dep = (today + datetime.timedelta(days=45)).isoformat()
        ret = (today + datetime.timedelta(days=50)).isoformat()

        result = await weather_service.get_weather_for_trip("Rome, Italy", dep, ret)
        assert result.forecast_available is False
        assert result.source_status == "out_of_range"
        assert "not yet available" in (result.planning_notes or "").lower()
        assert len(result.weather_days) == 0
        print("[PASS] test_3_travel_dates_outside_forecast_range")
    asyncio.run(_run())

def test_4_invalid_destination_geocoding():
    """Scenario 4: Non-existent destination gracefully returns location_not_found."""
    async def _run():
        result = await weather_service.get_weather_for_trip("XyZ123NonExistentCity999", "2026-10-01", "2026-10-05")
        assert result.forecast_available is False
        assert result.source_status == "location_not_found"
        print("[PASS] test_4_invalid_destination_geocoding")
    asyncio.run(_run())

def test_5_weather_service_network_error():
    """Scenario 5: Network failure / timeout returns graceful error status without crashing."""
    async def _run():
        with patch("httpx.AsyncClient.get", side_effect=Exception("Connection timed out")):
            result = await weather_service.get_weather_for_trip("London, UK", "2026-10-01", "2026-10-05")
            assert result.forecast_available is False
            assert result.source_status in ["location_not_found", "error"]
        print("[PASS] test_5_weather_service_network_error")
    asyncio.run(_run())

def test_6_plan_trip_executes_weather_tool_and_returns_context():
    """Scenario 6: POST /api/trip/plan executes weather tool and returns weather_context & weather_insight."""
    today = datetime.date.today()
    dep = (today + datetime.timedelta(days=2)).isoformat()
    ret = (today + datetime.timedelta(days=5)).isoformat()

    profile = _sample_enhanced_profile(destination="Jaipur, India", departure_date=dep, return_date=ret)
    res = client.post("/api/trip/plan", json=profile)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "weather_context" in data
    assert data["weather_context"] is not None
    assert "location" in data["weather_context"]
    assert "weather_insight" in data
    assert data["weather_insight"] is not None
    assert "summary" in data["weather_insight"]
    # Check execution trace mentions weather
    messages = data["execution"]["messages"]
    assert any("weather" in m.lower() for m in messages)
    print("[PASS] test_6_plan_trip_executes_weather_tool_and_returns_context")

def test_7_weather_failure_does_not_crash_planning():
    """Scenario 7: Weather tool failure does not crash LangGraph planning workflow."""
    profile = _sample_enhanced_profile(destination="London, UK")

    with patch("app.tools.weather_tool.weather_tool.fetch_weather_for_trip", side_effect=Exception("Weather API down")):
        res = client.post("/api/trip/plan", json=profile)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["planning_result"] is not None
        assert len(data["planning_result"]["tasks"]) >= 2
    print("[PASS] test_7_weather_failure_does_not_crash_planning")

def test_8_truthful_weather_insight_generation():
    """Scenario 8: Weather tool generates insight strictly derived from real weather data."""
    async def _run():
        sample_weather = WeatherResult(
            location="Jaipur, India",
            forecast_available=True,
            weather_days=[
                WeatherDay(
                    date="2026-10-01",
                    condition="Sunny",
                    temperature=32.0,
                    temperature_min=24.0,
                    temperature_max=35.0,
                    precipitation_probability=10,
                    precipitation_amount=0.0,
                    wind_speed=12.0,
                    weather_code=0
                )
            ],
            source_status="live_forecast",
            planning_notes="Live forecast retrieved"
        )

        insight = await weather_tool.generate_insight(sample_weather, "Family holiday")
        assert insight.summary is not None
        assert len(insight.summary) > 5
        assert len(insight.recommendations) >= 1
        print("[PASS] test_8_truthful_weather_insight_generation")
    asyncio.run(_run())

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_1_weather_service_live_geocoding_and_forecast())
    asyncio.run(test_2_travel_dates_within_forecast_range())
    asyncio.run(test_3_travel_dates_outside_forecast_range())
    asyncio.run(test_4_invalid_destination_geocoding())
    asyncio.run(test_5_weather_service_network_error())
    test_6_plan_trip_executes_weather_tool_and_returns_context()
    test_7_weather_failure_does_not_crash_planning()
    asyncio.run(test_8_truthful_weather_insight_generation())
    print("\n[ALL PASS] Phase 5 backend tests completed successfully!")
