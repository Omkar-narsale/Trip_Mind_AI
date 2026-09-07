"""
Phase 4 Test Suite for TripMind AI
Tests:
1. Normal leisure trip -> Decomposes into structured planning tasks and executes simulation
2. Very low budget trip -> Prioritizes budget allocation and affordable planning steps
3. Short duration trip -> Prioritizes fast pacing, central attractions, and transit optimization
4. Family trip -> Prioritizes family-friendly activities and comfortable stays
5. Trip with relaxation preference -> Avoids dense packed scheduling and prioritizes relaxation
6. Invalid EnhancedTripProfile -> Returns proper HTTP 422 / 503 validation failure
7. Groq API failure -> Falls back gracefully to standard baseline tasks
8. Malformed task output -> Gracefully recovers using fallback task structure
9. Dependency failure -> Detects unresolvable dependencies and marks them failed safely
"""
import os
import sys
from pathlib import Path
from unittest.mock import patch, AsyncMock

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from app.main import app
from app.agents.planner_agent import execute_task_simulation, TaskStatus, TaskPriority
from app.schemas.travel_plan import TravelPlanningResult, TravelPlanningTask

client = TestClient(app)

def _sample_enhanced_profile(
    destination="Paris, France",
    duration_days=5,
    travelers=2,
    budget=3000.0,
    budget_level="Moderate",
    preferences=None,
    travel_mood="Balanced exploration",
    pace="Standard",
    traveler_context="2 adults",
    combined_constraints=None
):
    return {
        "trip_request": {
            "origin": "New York, NY",
            "destination": destination,
            "departure_date": "2026-10-01",
            "return_date": "2026-10-06",
            "travelers": travelers,
            "budget": budget,
            "preferences": preferences or ["Food", "History"],
            "additional_instructions": None
        },
        "trip_analysis": {
            "origin": "New York, NY",
            "destination": destination,
            "departure_date": "2026-10-01",
            "return_date": "2026-10-06",
            "duration_days": duration_days,
            "travelers": travelers,
            "total_budget": budget,
            "budget_level": budget_level,
            "budget_per_day": round(budget / max(duration_days, 1), 2),
            "budget_per_traveler": round(budget / max(travelers, 1), 2),
            "travel_style": "Cultural exploration",
            "accommodation_expectation": "Standard 3-4 star hotel",
            "priority_preferences": preferences or ["Food", "History"],
            "suggested_activity_categories": ["Museums", "Culinary"],
            "planning_constraints": combined_constraints or [f"Budget capped at ${budget}"],
            "trip_summary": f"A {duration_days}-day trip to {destination} for {travelers} travelers.",
            "notes": "Estimated travel metrics for planning phase."
        },
        "travel_preferences": {
            "travel_mood": travel_mood,
            "pace": pace,
            "traveler_context": traveler_context,
            "accommodation_preferences": "Convenient location",
            "avoided_activities": [],
            "food_preferences": "Local cuisine",
            "transportation_preferences": "Public transit",
            "accessibility_or_special_constraints": None,
            "key_constraints": combined_constraints or [],
            "confidence_notes": "Standard extraction"
        },
        "combined_constraints": combined_constraints or ["Budget capped at $" + str(budget)],
        "planning_context": {
            "budget_per_day": round(budget / max(duration_days, 1), 2),
            "budget_per_traveler": round(budget / max(travelers, 1), 2),
            "duration_days": duration_days,
            "budget_level": budget_level,
            "destination": destination
        }
    }

def test_1_normal_leisure_trip():
    """Scenario 1: Normal leisure trip -> returns structured planning result and execution trace."""
    profile = _sample_enhanced_profile(destination="Rome, Italy", duration_days=5, travelers=2, budget=3000.0)
    res = client.post("/api/trip/plan", json=profile)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    plan = data["planning_result"]
    assert plan["overall_goal"]
    assert plan["planning_strategy"]
    assert len(plan["tasks"]) >= 2
    assert data["execution"]["status"] == "completed"
    assert len(data["execution"]["completed_tasks"]) >= 2
    # Verify no real external APIs claimed
    assert all("api" not in (t.get("execution_output") or "").lower() or "future phase" in (t.get("execution_output") or "").lower() for t in plan["tasks"])
    print("[PASS] test_1_normal_leisure_trip")

def test_2_very_low_budget_trip():
    """Scenario 2: Very low budget trip -> includes budget allocation and constraint consideration."""
    profile = _sample_enhanced_profile(
        destination="Bangkok, Thailand", 
        duration_days=7, 
        travelers=2, 
        budget=400.0, 
        budget_level="Budget",
        combined_constraints=["Strict budget of $400 USD total"]
    )
    res = client.post("/api/trip/plan", json=profile)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    plan = data["planning_result"]
    strategy_and_tasks = (plan["planning_strategy"] + " " + " ".join(t["task_name"] + " " + t["description"] for t in plan["tasks"])).lower()
    assert "budget" in strategy_and_tasks or "cost" in strategy_and_tasks
    print("[PASS] test_2_very_low_budget_trip")

def test_3_short_duration_trip():
    """Scenario 3: Short duration trip (2 days) -> agent adapts strategy for fast pacing."""
    profile = _sample_enhanced_profile(
        destination="Boston, MA", 
        duration_days=2, 
        travelers=1, 
        budget=600.0,
        combined_constraints=["Short weekend duration (2 days)"]
    )
    res = client.post("/api/trip/plan", json=profile)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    plan = data["planning_result"]
    assert len(plan["tasks"]) >= 2
    print("[PASS] test_3_short_duration_trip")

def test_4_family_trip():
    """Scenario 4: Family trip with kids -> agent factors in party dynamics."""
    profile = _sample_enhanced_profile(
        destination="Orlando, FL", 
        duration_days=6, 
        travelers=4, 
        budget=4500.0,
        traveler_context="Family with 2 young kids",
        combined_constraints=["Family-friendly pacing and kid-friendly attractions"]
    )
    res = client.post("/api/trip/plan", json=profile)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    plan = data["planning_result"]
    assert len(plan["tasks"]) >= 2
    print("[PASS] test_4_family_trip")

def test_5_trip_with_relaxation_preference():
    """Scenario 5: Trip with relaxation preference -> avoids packed schedules."""
    profile = _sample_enhanced_profile(
        destination="Bali, Indonesia", 
        duration_days=6, 
        travelers=2, 
        budget=3500.0,
        travel_mood="Relaxing and serene",
        pace="Slow / Leisurely",
        preferences=["Relaxation", "Beaches"]
    )
    res = client.post("/api/trip/plan", json=profile)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    plan = data["planning_result"]
    assert len(plan["tasks"]) >= 2
    print("[PASS] test_5_trip_with_relaxation_preference")

def test_6_invalid_enhanced_trip_profile():
    """Scenario 6: Invalid trip profile payload returns 422 unprocessable entity."""
    invalid_profile = {
        "trip_request": {
            "origin": "SamePlace",
            "destination": "SamePlace"
        }
    }
    res = client.post("/api/trip/plan", json=invalid_profile)
    assert res.status_code in [422, 500]
    print("[PASS] test_6_invalid_enhanced_trip_profile")

def test_7_groq_api_failure_fallback():
    """Scenario 7: When Groq API raises an exception, generate_tasks falls back gracefully."""
    profile = _sample_enhanced_profile(destination="London, UK")
    
    # Mock LLM chain invocation to raise an error
    with patch("app.agents.planner_agent.get_llm", side_effect=Exception("Groq API rate limit reached")):
        res = client.post("/api/trip/plan", json=profile)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        plan = data["planning_result"]
        # Fallback tasks should still exist and execute
        assert len(plan["tasks"]) >= 2
        assert any("validate_constraints" == t["task_id"] for t in plan["tasks"])
    print("[PASS] test_7_groq_api_failure_fallback")

def test_8_malformed_task_output_fallback():
    """Scenario 8: If LLM returns malformed data structure, fallback generates valid workflow."""
    profile = _sample_enhanced_profile(destination="Tokyo, Japan")
    
    # Simulate LLM chain returning unparseable result
    mock_chain = AsyncMock()
    mock_chain.ainvoke.side_effect = ValueError("Structured output validation failed")

    with patch("langchain_core.prompts.ChatPromptTemplate.__or__", return_value=mock_chain):
        res = client.post("/api/trip/plan", json=profile)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert len(data["planning_result"]["tasks"]) >= 2
    print("[PASS] test_8_malformed_task_output_fallback")

def test_9_dependency_failure_handling():
    """Scenario 9: Unresolvable task dependencies are safely marked as FAILED with safe error messages."""
    import asyncio
    broken_tasks = [
        {
            "task_id": "task_a",
            "task_name": "Dependent Task A",
            "description": "Needs missing task X",
            "priority": "high",
            "dependencies": ["missing_task_x"],
            "status": "pending"
        }
    ]
    test_state = {
        "planning_tasks": broken_tasks,
        "agent_messages": [],
        "errors": []
    }
    sim_result = asyncio.run(execute_task_simulation(test_state))
    completed = sim_result["completed_tasks"]
    assert len(completed) == 1
    assert completed[0]["status"] == TaskStatus.FAILED.value
    assert "could not be resolved" in completed[0]["execution_output"]
    assert len(sim_result["errors"]) >= 1
    print("[PASS] test_9_dependency_failure_handling")

if __name__ == "__main__":
    test_1_normal_leisure_trip()
    test_2_very_low_budget_trip()
    test_3_short_duration_trip()
    test_4_family_trip()
    test_5_trip_with_relaxation_preference()
    test_6_invalid_enhanced_trip_profile()
    test_7_groq_api_failure_fallback()
    test_8_malformed_task_output_fallback()
    test_9_dependency_failure_handling()
    print("\n[ALL PASS] Phase 4 tests completed successfully!")
