import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.budget_service import budget_service
from app.schemas.budget import BudgetPlanRequest

client = TestClient(app)

def test_budget_fallback_allocation():
    req = BudgetPlanRequest(
        destination="Jaipur",
        origin="Delhi",
        total_budget=50000.0,
        travelers=2,
        duration_days=5,
        budget_tier="Moderate"
    )
    res = budget_service._fallback_allocation(req)
    assert res.destination == "Jaipur"
    assert res.total_budget == 50000.0
    assert len(res.categories) == 5
    
    # Check that sum of allocated amounts matches total budget within 0.05
    category_sum = sum(c.allocated_amount for c in res.categories)
    assert abs(category_sum - 50000.0) < 0.05
    
    # Check currency conversion rates exist
    assert "USD" in res.rates_from_inr
    assert "EUR" in res.rates_from_inr
    assert "INR" in res.rates_from_inr
    assert len(res.saving_tips) >= 3

def test_budget_api_endpoint():
    payload = {
        "destination": "Goa",
        "origin": "Mumbai",
        "total_budget": 45000.0,
        "travelers": 3,
        "duration_days": 4,
        "budget_tier": "Moderate",
        "travel_style": "Coastal Leisure"
    }
    response = client.post("/api/budget/allocation", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["destination"] == "Goa"
    assert data["total_budget"] == 45000.0
    assert data["travelers"] == 3
    assert data["duration_days"] == 4
    assert len(data["categories"]) >= 5
    assert "rates_from_inr" in data
    assert "currency_symbols" in data
    assert "saving_tips" in data
    assert len(data["saving_tips"]) > 0

def test_budget_validation_error():
    payload = {
        "destination": "Goa",
        "total_budget": -500.0  # Invalid negative budget
    }
    response = client.post("/api/budget/allocation", json=payload)
    assert response.status_code == 422
