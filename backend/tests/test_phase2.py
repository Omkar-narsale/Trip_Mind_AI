"""
Phase 2 Test Suite for TripMind AI
Tests:
1. Valid trip analysis via POST /api/trip/analyze
2. Missing GROQ_API_KEY handling
3. Invalid trip request validation (origin == destination, travelers < 1, budget <= 0)
4. LLM service initialization and error resilience
"""
import os
import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.llm_service import LLMService

client = TestClient(app)

def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json() == {"message": "TripMind AI Backend Running"}

def test_phase1_trip_endpoint():
    payload = {
        "origin": "Chicago, IL",
        "destination": "London, UK",
        "departure_date": "2026-09-10",
        "return_date": "2026-09-18",
        "travelers": 2,
        "budget": 4500.0,
        "preferences": ["Food", "History"]
    }
    res = client.post("/api/trip", json=payload)
    assert res.status_code == 200
    assert res.json()["message"] == "Trip request received successfully"

def test_invalid_trip_requests():
    base_payload = {
        "origin": "Paris, France",
        "destination": "London, UK",
        "departure_date": "2026-10-01",
        "return_date": "2026-10-10",
        "travelers": 2,
        "budget": 3000.0,
        "preferences": ["Food"]
    }

    # Same origin & destination
    res = client.post("/api/trip/analyze", json={**base_payload, "origin": "London", "destination": "London"})
    assert res.status_code == 422

    # Travelers < 1
    res = client.post("/api/trip/analyze", json={**base_payload, "travelers": 0})
    assert res.status_code == 422

    # Budget <= 0
    res = client.post("/api/trip/analyze", json={**base_payload, "budget": -500})
    assert res.status_code == 422

def test_missing_groq_api_key(monkeypatch):
    monkeypatch.setattr("app.config.settings.GROQ_API_KEY", None)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    LLMService.reset_instance()

    payload = {
        "origin": "Miami, FL",
        "destination": "Cancun, Mexico",
        "departure_date": "2026-11-01",
        "return_date": "2026-11-06",
        "travelers": 2,
        "budget": 2500.0,
        "preferences": ["Beaches", "Relaxation"]
    }
    res = client.post("/api/trip/analyze", json=payload)
    assert res.status_code == 503
    assert "GROQ_API_KEY is missing" in res.json()["detail"]

    # Reset back for subsequent tests
    LLMService.reset_instance()

def test_valid_trip_analyze_live():
    # Only run live call if GROQ_API_KEY is present
    from app.config import settings
    if not settings.GROQ_API_KEY or "your_groq" in settings.GROQ_API_KEY:
        pytest.skip("Skipping live test because valid GROQ_API_KEY is not configured.")

    payload = {
        "origin": "New York, NY",
        "destination": "Rome, Italy",
        "departure_date": "2026-10-05",
        "return_date": "2026-10-12",
        "travelers": 2,
        "budget": 5000.0,
        "preferences": ["Food", "History", "Relaxation"]
    }
    res = client.post("/api/trip/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    analysis = data["analysis"]
    assert "trip_summary" in analysis
    assert analysis["duration_days"] >= 1
    assert analysis["budget_per_traveler"] == 2500.0
    assert analysis["budget_level"] in ["Budget", "Moderate", "Premium", "Luxury"]
    assert len(analysis["priority_preferences"]) > 0

if __name__ == "__main__":
    test_root_endpoint()
    print("[PASS] test_root_endpoint")
    test_phase1_trip_endpoint()
    print("[PASS] test_phase1_trip_endpoint")
    test_invalid_trip_requests()
    print("[PASS] test_invalid_trip_requests")
    test_valid_trip_analyze_live()
    print("[PASS] test_valid_trip_analyze_live")
    print("[ALL PASS] Phase 2 tests completed successfully!")
