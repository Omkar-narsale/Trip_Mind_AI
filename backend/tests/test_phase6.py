import pytest
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime, timedelta

from app.schemas.trip import TripCreate
from app.schemas.trip_analysis import TripAnalysis, BudgetLevel
from app.schemas.travel_preferences import ExtractedTravelPreferences, EnhancedTripProfile
from app.schemas.places import Place, PlacesResult, RankedAttraction
from app.schemas.weather import WeatherResult, WeatherDay
from app.services.places_service import places_service, calculate_haversine_distance, categorize_osm_tags
from app.services.attraction_ranker import attraction_ranker, build_heuristic_ranking
from app.tools.places_tool import places_tool
from app.services.planning_service import planning_service
from app.agents.planner_agent import planner_graph

def test_1_haversine_distance_and_categorization():
    # Distance between Paris (48.8566, 2.3522) and Eiffel Tower (48.8584, 2.2945) ~ 4.2 km
    dist = calculate_haversine_distance(48.8566, 2.3522, 48.8584, 2.2945)
    assert 3.5 <= dist <= 5.0

    # Categorization test
    assert categorize_osm_tags({"tourism": "museum"}) == "Museum & Heritage"
    assert categorize_osm_tags({"historic": "castle"}) == "Historical & Landmark"
    assert categorize_osm_tags({"leisure": "park"}) == "Nature & Outdoors"
    assert categorize_osm_tags({"tourism": "viewpoint"}) == "Viewpoint & Scenic"
    assert categorize_osm_tags({"amenity": "place_of_worship"}) == "Culture & Arts"
    assert categorize_osm_tags({"tourism": "zoo"}) == "Entertainment & Family"
    assert categorize_osm_tags({"amenity": "restaurant"}) == "Dining & Culinary"

def test_2_places_service_live_geocoding_and_fetch():
    async def _run():
        res: PlacesResult = await places_service.fetch_places_for_destination("Jaipur", radius_meters=10000, max_results=10)
        assert res.destination != ""
        assert res.latitude is not None
        assert res.longitude is not None
        assert res.source_status == "success"
        assert len(res.places) > 0
        first_place = res.places[0]
        assert first_place.name != ""
        assert first_place.category != ""
        assert first_place.latitude != 0.0
        assert first_place.source == "OpenStreetMap / Overpass API"
    asyncio.run(_run())

def test_3_places_service_invalid_destination():
    async def _run():
        res = await places_service.fetch_places_for_destination("xyznonexistentdestination9999999")
        assert res.source_status == "error"
        assert len(res.places) == 0
        assert "Could not resolve geographical coordinates" in (res.message or "")
    asyncio.run(_run())

def test_4_places_service_network_error_resilience():
    async def _run():
        with patch.object(places_service.__class__, "geocode_destination", new=AsyncMock(return_value=(26.91, 75.78, "Jaipur, India"))):
            with patch("httpx.AsyncClient.post", side_effect=Exception("Overpass network timeout")):
                with patch.object(places_service.__class__, "_fetch_from_nominatim_pois", new=AsyncMock(return_value=[])):
                    res = await places_service.fetch_places_for_destination("Jaipur")
                    assert res.source_status in ["error", "no_results"]
                    assert len(res.places) == 0
    asyncio.run(_run())

def test_5_attraction_ranker_heuristic_fallback():
    mock_places = [
        Place(
            place_id="osm_node_1",
            name="Amber Fort",
            category="Historical & Landmark",
            latitude=26.9855,
            longitude=75.8513,
            distance_km=8.5
        ),
        Place(
            place_id="osm_node_2",
            name="Central Park",
            category="Nature & Outdoors",
            latitude=26.9000,
            longitude=75.8000,
            distance_km=2.1
        )
    ]
    trip_req = TripCreate(
        origin="Delhi",
        destination="Jaipur",
        departure_date="2026-10-01",
        return_date="2026-10-05",
        travelers=2,
        budget=1200.0,
        preferences=["History", "Culture"]
    )
    profile = EnhancedTripProfile(
        trip_request=trip_req,
        trip_analysis=TripAnalysis(
            duration_days=4,
            budget_level=BudgetLevel.MODERATE,
            budget_per_day=300.0,
            budget_per_traveler=600.0,
            feasibility_score=85,
            travel_style="Cultural Exploration",
            accommodation_expectation="Boutique heritage hotel",
            trip_summary="4-day cultural exploration in Jaipur.",
            notes="Standard planning notes."
        ),
        travel_preferences=ExtractedTravelPreferences(
            travel_mood="Curious & Historical",
            pace="Moderate",
            traveler_context="Couple"
        ),
        combined_constraints=[]
    )

    ranked = build_heuristic_ranking(mock_places, profile)
    assert len(ranked) == 2
    # Amber Fort should rank highest for history/culture
    assert ranked[0].place.name == "Amber Fort"
    assert ranked[0].relevance_score > ranked[1].relevance_score
    assert "Historical Interest" in ranked[0].matched_preferences

def test_6_attraction_ranker_weather_awareness():
    mock_places = [
        Place(
            place_id="osm_node_2",
            name="Central Park",
            category="Nature & Outdoors",
            latitude=26.9000,
            longitude=75.8000,
            distance_km=2.1
        )
    ]
    trip_req = TripCreate(
        origin="Delhi",
        destination="Jaipur",
        departure_date="2026-10-01",
        return_date="2026-10-05",
        travelers=2,
        budget=1200.0,
        preferences=["Nature"]
    )
    profile = EnhancedTripProfile(
        trip_request=trip_req,
        trip_analysis=TripAnalysis(
            duration_days=4,
            budget_level=BudgetLevel.MODERATE,
            budget_per_day=300.0,
            budget_per_traveler=600.0,
            feasibility_score=85,
            travel_style="Nature",
            accommodation_expectation="Standard",
            trip_summary="4-day trip.",
            notes="Standard planning notes."
        ),
        travel_preferences=ExtractedTravelPreferences(
            travel_mood="Relaxed",
            pace="Slow",
            traveler_context="Solo"
        ),
        combined_constraints=[]
    )
    weather_res = WeatherResult(
        location="Jaipur",
        forecast_available=True,
        weather_days=[
            WeatherDay(
                date="2026-10-01",
                weather_code=61,
                condition="Moderate Rain",
                temperature_max=25.0,
                temperature_min=20.0,
                precipitation_probability=80
            )
        ]
    )

    ranked = build_heuristic_ranking(mock_places, profile, weather_result=weather_res)
    assert len(ranked) == 1
    # Check that rainy weather consideration was attached for outdoor venue
    assert any("weather" in c.lower() or "outdoor" in c.lower() for c in ranked[0].potential_considerations)

def test_7_places_tool_live_discovery_and_ranking():
    async def _run():
        trip_req = TripCreate(
            origin="Delhi",
            destination="Jaipur",
            departure_date="2026-11-01",
            return_date="2026-11-06",
            travelers=2,
            budget=1500.0,
            preferences=["History", "Culture"]
        )
        profile = EnhancedTripProfile(
            trip_request=trip_req,
            trip_analysis=TripAnalysis(
                duration_days=5,
                budget_level=BudgetLevel.MODERATE,
                budget_per_day=300.0,
                budget_per_traveler=750.0,
                feasibility_score=90,
                travel_style="Cultural & Heritage",
                accommodation_expectation="Heritage Haveli",
                trip_summary="5-day cultural trip.",
                notes="Standard planning notes."
            ),
            travel_preferences=ExtractedTravelPreferences(
                travel_mood="Curious",
                pace="Moderate",
                traveler_context="Couple"
            ),
            combined_constraints=[]
        )

        places_res, ranked = await places_tool.discover_and_rank_places(
            destination="Jaipur",
            profile=profile
        )
        assert places_res.source_status in ["success", "no_results", "error"]
        if places_res.source_status == "success":
            assert len(places_res.places) > 0
            assert len(ranked) > 0
            assert ranked[0].relevance_score >= 0
            assert ranked[0].place.name != ""
    asyncio.run(_run())

def test_8_langgraph_full_planning_workflow_with_weather_and_places():
    async def _run():
        today = datetime.now()
        dep = (today + timedelta(days=2)).strftime("%Y-%m-%d")
        ret = (today + timedelta(days=6)).strftime("%Y-%m-%d")

        trip_req = TripCreate(
            origin="Delhi",
            destination="Jaipur",
            departure_date=dep,
            return_date=ret,
            travelers=2,
            budget=1400.0,
            preferences=["Historical Sites", "Culture", "Local Food"]
        )
        profile = EnhancedTripProfile(
            trip_request=trip_req,
            trip_analysis=TripAnalysis(
                duration_days=4,
                budget_level=BudgetLevel.MODERATE,
                budget_per_day=350.0,
                budget_per_traveler=700.0,
                feasibility_score=90,
                travel_style="Cultural & Heritage",
                accommodation_expectation="Heritage Haveli",
                trip_summary="4-day heritage trip to Jaipur.",
                notes="Standard planning notes."
            ),
            travel_preferences=ExtractedTravelPreferences(
                travel_mood="Exploratory & Rich",
                pace="Moderate",
                traveler_context="Couple with keen interest in architecture",
                food_preferences="Rajasthani thali, street snacks"
            ),
            combined_constraints=["Avoid high-intensity climbs in midday heat"]
        )

        plan_response = await planning_service.create_travel_plan(profile)

        assert plan_response.success is True
        assert plan_response.planning_result is not None
        assert len(plan_response.execution.completed_tasks) > 0

        # Verify Weather Context
        assert plan_response.weather_context is not None
        assert plan_response.weather_context.location != ""

        # Verify Places Context & Ranked Attractions
        assert plan_response.places_context is not None
        assert plan_response.places_context.source_status in ["success", "no_results"]
        if plan_response.places_context.source_status == "success":
            assert len(plan_response.places_context.places) > 0

        if plan_response.ranked_attractions:
            top_match = plan_response.ranked_attractions[0]
            assert top_match.place.name != ""
            assert top_match.relevance_score >= 0
            assert top_match.suitability_reason != ""

            # Verify no fake places were injected
            raw_place_ids = {p.place_id for p in plan_response.places_context.places}
            for ranked_item in plan_response.ranked_attractions:
                assert ranked_item.place.place_id in raw_place_ids

    asyncio.run(_run())
