import logging
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

from app.schemas.places import Place, PlacesResult, RankedAttraction, RankedAttractionList
from app.schemas.travel_preferences import EnhancedTripProfile
from app.schemas.weather import WeatherResult
from app.services.llm_service import get_llm

logger = logging.getLogger(__name__)

class LLMAttractionEvaluation(BaseModel):
    place_id: str = Field(..., description="ID matching the input place.")
    relevance_score: int = Field(..., ge=0, le=100, description="Relevance score from 0-100.")
    relevance_level: str = Field(default="medium", description="'high', 'medium', or 'low'.")
    matched_preferences: List[str] = Field(default_factory=list, description="Specific matched travel preferences or themes.")
    suitability_reason: str = Field(..., description="1-2 sentences explaining why this attraction fits the user's travel style and mood.")
    potential_considerations: List[str] = Field(default_factory=list, description="Practical considerations (e.g., walking, family suitability, weather dependency).")

class LLMAttractionRankingResponse(BaseModel):
    evaluations: List[LLMAttractionEvaluation] = Field(default_factory=list, description="Evaluations for each provided real place.")

SYSTEM_RANKING_PROMPT = """You are the TripMind AI Attractions & Points of Interest Intelligence Engine.

You will receive:
1. A list of REAL places retrieved from OpenStreetMap / Overpass API.
2. The traveler's enhanced profile (travel style, preferences, mood, pace, party dynamics, avoided activities, constraints).
3. Weather forecast context (if available).

STRICT DIRECTIVES:
1. NEVER INVENT ATTRACTIONS. You must ONLY evaluate and rank the exact real places provided in the input list.
2. DO NOT modify place names or create fake historical places.
3. For every place in the input list, provide:
   - `place_id`: Must exactly match the input place's `place_id`.
   - `relevance_score`: 0 to 100 based on how well it satisfies the traveler's stated preferences, pace, and mood.
   - `relevance_level`: 'high' (>=80), 'medium' (50-79), or 'low' (<50).
   - `matched_preferences`: List of matched themes (e.g., 'History', 'Nature', 'Photography', 'Serenity', 'Architecture').
   - `suitability_reason`: Concise, natural 1-2 sentences explaining why this specific real venue fits the traveler.
   - `potential_considerations`: 1-2 practical notes (e.g., 'Requires uphill walking', 'Indoor venue ideal for rain/heat', 'Family-friendly').
4. WEATHER AWARENESS:
   - If the weather context indicates high rain probability or extreme temperatures, note whether outdoor venues are weather-dependent, and elevate indoor cultural/museum venues appropriately.
   - NEVER fabricate weather numbers; use only the provided weather summary."""

HUMAN_RANKING_PROMPT = """Evaluate and rank these REAL places for the following traveler:

=== TRAVELER PROFILE ===
Destination: {destination}
Travel Style: {travel_style}
Explicit Preferences: {preferences}
Travel Mood: {travel_mood}
Pace: {pace}
Traveler Group: {traveler_context}
Avoided Activities: {avoided_activities}
Special Constraints: {combined_constraints}

=== WEATHER CONTEXT ===
{weather_context_text}

=== REAL PLACES RETRIEVED (from OpenStreetMap) ===
{places_list_text}

Evaluate every place and return structured evaluations:"""

def build_heuristic_ranking(
    places: List[Place],
    profile: EnhancedTripProfile,
    weather_result: Optional[WeatherResult] = None
) -> List[RankedAttraction]:
    """Fallback heuristic ranking when LLM is unavailable."""
    prefs = [p.lower() for p in (profile.trip_request.preferences or [])]
    mood = (profile.travel_preferences.travel_mood or "").lower() if profile.travel_preferences else ""
    avoided = [a.lower() for a in ((profile.travel_preferences.avoided_activities if profile.travel_preferences else []) or [])]

    is_rainy = False
    if weather_result and weather_result.forecast_available:
        is_rainy = any(
            (day.precipitation_probability or 0) > 40 or "rain" in (day.condition or "").lower()
            for day in weather_result.weather_days
        )

    ranked: List[RankedAttraction] = []

    for place in places:
        cat = place.category.lower()
        score = 65
        matched = []
        considerations = []

        # Category keyword heuristics
        if any(kw in cat for kw in ["historical", "museum", "culture", "heritage"]):
            if any(p in ["history", "culture", "heritage", "museum", "art"] for p in prefs):
                score += 25
                matched.extend(["Historical Interest", "Cultural Exploration"])
            else:
                score += 10
                matched.append("Cultural Landmark")
        elif any(kw in cat for kw in ["nature", "park", "outdoors", "viewpoint"]):
            if any(p in ["nature", "scenic", "relaxation", "adventure", "hiking", "beach"] for p in prefs):
                score += 25
                matched.extend(["Nature & Scenic", "Outdoor Relaxation"])
            else:
                score += 10
                matched.append("Scenic Venue")
            if is_rainy:
                considerations.append("Outdoor venue: verify local weather conditions on visit day.")
        
        if mood and mood in ["relaxed", "chill", "leisure", "laid-back"]:
            if "park" in cat or "garden" in cat or "viewpoint" in cat or "beach" in cat:
                score += 10
                matched.append("Relaxed Atmosphere")

        # Avoided penalty
        if any(av in cat or av in place.name.lower() for av in avoided):
            score -= 30
            considerations.append("May conflict with avoided activity preference.")

        score = max(20, min(98, score))
        level = "high" if score >= 80 else ("medium" if score >= 50 else "low")
        
        reason = f"Selected from OpenStreetMap as a prominent {place.category.lower()} aligned with your journey to {place.name}."
        if not considerations:
            considerations = ["Standard local opening hours and accessibility apply."]

        ranked.append(RankedAttraction(
            place=place,
            relevance_score=score,
            relevance_level=level,
            matched_preferences=list(set(matched)) or ["Destination Highlight"],
            suitability_reason=reason,
            potential_considerations=considerations
        ))

    ranked.sort(key=lambda r: r.relevance_score, reverse=True)
    return ranked

class AttractionRanker:
    """Ranks real OpenStreetMap places against traveler profile and active weather."""

    @classmethod
    async def rank_attractions(
        cls,
        places_result: PlacesResult,
        profile: EnhancedTripProfile,
        weather_result: Optional[WeatherResult] = None
    ) -> List[RankedAttraction]:
        if not places_result.places:
            return []

        places = places_result.places
        # Limit batch to top 20 to avoid excessive token sizes
        eval_places = places[:20]
        place_by_id = {p.place_id: p for p in eval_places}

        # Build prompt inputs
        places_text_lines = []
        for idx, p in enumerate(eval_places, 1):
            dist_str = f", Distance: {p.distance_km}km" if p.distance_km is not None else ""
            desc_str = f" - {p.description}" if p.description else ""
            places_text_lines.append(f"{idx}. ID: {p.place_id} | Name: {p.name} | Category: {p.category}{dist_str}{desc_str}")
        places_list_text = "\n".join(places_text_lines)

        weather_text = "Weather Context: No forecast data active."
        if weather_result:
            if weather_result.forecast_available and weather_result.weather_days:
                first_day = weather_result.weather_days[0]
                weather_text = (
                    f"Weather Context: {first_day.condition}, "
                    f"Temp: {first_day.temperature_min}°C to {first_day.temperature_max}°C, "
                    f"Rain Probability: {first_day.precipitation_probability or 0}%. "
                    f"{weather_result.planning_notes or ''}"
                )
            else:
                weather_text = f"Weather Context: {weather_result.planning_notes or 'Forecast unavailable.'}"

        trip_req = profile.trip_request
        travel_prefs = profile.travel_preferences
        trip_analysis = profile.trip_analysis

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_RANKING_PROMPT),
            ("human", HUMAN_RANKING_PROMPT)
        ])

        try:
            llm = get_llm()
            structured_llm = llm.with_structured_output(LLMAttractionRankingResponse)
            chain = prompt_template | structured_llm

            prompt_input = {
                "destination": trip_req.destination,
                "travel_style": trip_analysis.travel_style if trip_analysis else "Standard",
                "preferences": ", ".join(trip_req.preferences or []) or "General sightseeing",
                "travel_mood": travel_prefs.travel_mood if travel_prefs else "Flexible",
                "pace": travel_prefs.pace if travel_prefs else "Standard",
                "traveler_context": travel_prefs.traveler_context if travel_prefs else f"{trip_req.travelers} traveler(s)",
                "avoided_activities": ", ".join(travel_prefs.avoided_activities if travel_prefs else []) or "None",
                "combined_constraints": "; ".join(profile.combined_constraints) if profile.combined_constraints else "None",
                "weather_context_text": weather_text,
                "places_list_text": places_list_text
            }

            resp: LLMAttractionRankingResponse = await chain.ainvoke(prompt_input)

            ranked_attractions: List[RankedAttraction] = []
            for ev in resp.evaluations:
                real_place = place_by_id.get(ev.place_id)
                if real_place:
                    ranked_attractions.append(RankedAttraction(
                        place=real_place,
                        relevance_score=max(0, min(100, ev.relevance_score)),
                        relevance_level=ev.relevance_level if ev.relevance_level in ["high", "medium", "low"] else "medium",
                        matched_preferences=ev.matched_preferences or [real_place.category],
                        suitability_reason=ev.suitability_reason,
                        potential_considerations=ev.potential_considerations or ["Check local opening times prior to visit."]
                    ))

            # Include any missing places via heuristic fallback
            evaluated_ids = {r.place.place_id for r in ranked_attractions}
            for p in eval_places:
                if p.place_id not in evaluated_ids:
                    ranked_attractions.append(RankedAttraction(
                        place=p,
                        relevance_score=60,
                        relevance_level="medium",
                        matched_preferences=[p.category],
                        suitability_reason=f"Popular {p.category.lower()} in {trip_req.destination}.",
                        potential_considerations=["Standard local visitor guidelines."]
                    ))

            ranked_attractions.sort(key=lambda x: x.relevance_score, reverse=True)
            return ranked_attractions

        except Exception as e:
            logger.warning(f"Groq attraction ranking encountered error: {e}. Falling back to heuristic ranking.")
            return build_heuristic_ranking(places, profile, weather_result)

attraction_ranker = AttractionRanker()
