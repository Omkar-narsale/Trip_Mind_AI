import logging
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

from app.schemas.hotel import Hotel, HotelResult, RankedHotel
from app.schemas.travel_preferences import EnhancedTripProfile
from app.services.llm_service import get_llm

logger = logging.getLogger(__name__)

class LLMHotelEvaluation(BaseModel):
    hotel_id: str = Field(..., description="ID matching the input hotel.")
    relevance_score: int = Field(..., ge=0, le=100, description="Relevance score from 0-100.")
    relevance_level: str = Field(default="medium", description="'high', 'medium', or 'low'.")
    matched_preferences: List[str] = Field(default_factory=list, description="Specific matched accommodation features (e.g., Central, Budget, Relaxed, Family).")
    suitability_reason: str = Field(..., description="1-2 sentences explaining why this stay fits the traveler's budget, party size, and style.")
    potential_considerations: List[str] = Field(default_factory=list, description="Practical notes (e.g., transit convenience, quiet neighborhood, proximity to center).")

class LLMHotelRankingResponse(BaseModel):
    evaluations: List[LLMHotelEvaluation] = Field(default_factory=list, description="Evaluations for each provided real hotel.")

SYSTEM_HOTEL_RANKING_PROMPT = """You are the TripMind AI Accommodation & Lodging Intelligence Engine.

You will receive:
1. A list of REAL accommodation venues retrieved from OpenStreetMap / Overpass API.
2. The traveler's enhanced profile (budget tier, per-day budget, party size, travel style, mood, pace, and specific accommodation preferences).

STRICT DIRECTIVES:
1. NEVER INVENT HOTELS. You must ONLY evaluate and rank the exact real venues provided in the input list.
2. DO NOT invent prices, star ratings, room availability, or booking links.
3. For every hotel in the input list, provide:
   - `hotel_id`: Must exactly match the input hotel's `hotel_id`.
   - `relevance_score`: 0 to 100 based on how well the accommodation type, location distance, and context match the traveler's budget level and style.
   - `relevance_level`: 'high' (>=80), 'medium' (50-79), or 'low' (<50).
   - `matched_preferences`: List of matched accommodation tags (e.g., 'Budget-Friendly', 'Central Location', 'Quiet Retreat', 'Family Suitable', 'Boutique Appeal').
   - `suitability_reason`: 1-2 natural sentences explaining why this specific accommodation suits the traveler.
   - `potential_considerations`: 1-2 practical notes (e.g., 'Check local room availability directly with property', 'Located 3.5km from central sights').
4. If the traveler is on a Budget/Backpacker tier, prioritize Hostels and Guest Houses. If Luxury/Comfort, prioritize upscale Hotels and Resorts. For Families, note spaciousness and accessibility."""

HUMAN_HOTEL_RANKING_PROMPT = """Evaluate and rank these REAL accommodation venues for the following traveler:

=== TRAVELER PROFILE ===
Destination: {destination}
Budget Tier: {budget_level} (Total: ${budget} USD, Daily: ${budget_per_day}/day)
Travelers: {travelers} ({traveler_context})
Travel Style: {travel_style}
Accommodation Expectation: {accommodation_expectation}
Accommodation Preferences: {accommodation_preferences}
Travel Mood: {travel_mood}
Pace: {pace}
Special Constraints: {combined_constraints}

=== REAL ACCOMMODATION VENUES RETRIEVED (from OpenStreetMap) ===
{hotels_list_text}

Evaluate each hotel and return structured evaluations:"""

def build_heuristic_hotel_ranking(
    hotels: List[Hotel],
    profile: EnhancedTripProfile
) -> List[RankedHotel]:
    """Fallback heuristic ranking when LLM is unavailable."""
    trip_req = profile.trip_request
    trip_analysis = profile.trip_analysis
    budget_level = (trip_analysis.budget_level if trip_analysis else "Moderate").lower()
    acc_pref = ((profile.travel_preferences.accommodation_preferences if profile.travel_preferences else "") or "").lower()
    travel_style = (trip_analysis.travel_style if trip_analysis else "").lower()
    party_size = trip_req.travelers

    ranked: List[RankedHotel] = []

    for hotel in hotels:
        score = 65
        matched = []
        considerations = []
        h_type = (hotel.accommodation_type or "Hotel").lower()
        dist = hotel.distance_km or 5.0

        # Distance proximity heuristic
        if dist < 3.0:
            score += 15
            matched.append("Central Location")
        elif dist < 7.0:
            score += 8
            matched.append("Moderate Distance")
        else:
            score -= 5
            considerations.append(f"Located {dist}km from the city core; consider transit options.")

        # Budget tier heuristic
        if "budget" in budget_level or "economy" in budget_level:
            if "hostel" in h_type or "guest house" in h_type or "b&b" in h_type:
                score += 20
                matched.append("Budget-Friendly Stays")
            elif "resort" in h_type or "luxury" in h_type:
                score -= 15
                considerations.append("May lean above target economy budget tier.")
        elif "luxury" in budget_level or "premium" in budget_level:
            if "resort" in h_type or "hotel" in h_type:
                score += 15
                matched.append("Premium Accommodation")
        else:
            matched.append("Balanced Value")

        # Traveler context
        if party_size > 2:
            if "apartment" in h_type or "suite" in h_type or "guest house" in h_type:
                score += 10
                matched.append("Group & Family Friendly")
        elif party_size == 1:
            if "hostel" in h_type:
                score += 10
                matched.append("Solo Traveler Favorite")

        # Stated preference alignment
        if acc_pref:
            if any(w in acc_pref for w in ["central", "downtown", "center"]) and dist < 4.0:
                score += 10
                matched.append("Matches Central Preference")
            if any(w in acc_pref for w in ["boutique", "charming", "unique"]) and "boutique" in h_type:
                score += 15
                matched.append("Boutique Aesthetic")
            if any(w in acc_pref for w in ["quiet", "peaceful", "nature"]) and dist >= 3.0:
                score += 10
                matched.append("Peaceful Environment")

        # Star rating heuristic
        if hotel.rating:
            if hotel.rating >= 4.0:
                score += 8
                matched.append(f"Rated {hotel.rating} Stars")
            elif hotel.rating >= 3.0:
                score += 4

        score = max(25, min(97, score))
        level = "high" if score >= 80 else ("medium" if score >= 50 else "low")

        reason = (
            f"Verified {hotel.accommodation_type.lower() if hotel.accommodation_type else 'hotel'} "
            f"located {dist}km from destination center, well-suited for a {budget_level} {travel_style or 'leisure'} journey."
        )

        if not considerations:
            if hotel.address:
                considerations.append(f"Located at {hotel.address}.")
            else:
                considerations.append("Confirm room rates and amenities directly with property.")

        ranked.append(RankedHotel(
            hotel=hotel,
            relevance_score=score,
            relevance_level=level,
            matched_preferences=list(set(matched)) or ["Verified Accommodation"],
            suitability_reason=reason,
            potential_considerations=considerations
        ))

    ranked.sort(key=lambda r: r.relevance_score, reverse=True)
    return ranked

class HotelRanker:
    """Ranks verified accommodations against user travel profile and constraints."""

    @classmethod
    async def rank_hotels(
        cls,
        hotel_result: HotelResult,
        profile: EnhancedTripProfile
    ) -> List[RankedHotel]:
        if not hotel_result.hotels:
            return []

        hotels = hotel_result.hotels
        # Top 15 hotels to keep prompt focused and within Groq token limits
        eval_hotels = hotels[:15]
        hotel_by_id = {h.hotel_id: h for h in eval_hotels}

        hotels_text_lines = []
        for idx, h in enumerate(eval_hotels, 1):
            dist_str = f", Distance: {h.distance_km}km" if h.distance_km is not None else ""
            rating_str = f", Rating: {h.rating} stars" if h.rating else ""
            addr_str = f", Address: {h.address}" if h.address else ""
            hotels_text_lines.append(
                f"{idx}. ID: {h.hotel_id} | Name: {h.name} | Type: {h.accommodation_type or 'Hotel'}{dist_str}{rating_str}{addr_str}"
            )
        hotels_list_text = "\n".join(hotels_text_lines)

        trip_req = profile.trip_request
        travel_prefs = profile.travel_preferences
        trip_analysis = profile.trip_analysis

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_HOTEL_RANKING_PROMPT),
            ("human", HUMAN_HOTEL_RANKING_PROMPT)
        ])

        try:
            llm = get_llm()
            structured_llm = llm.with_structured_output(LLMHotelRankingResponse)
            chain = prompt_template | structured_llm

            prompt_input = {
                "destination": trip_req.destination,
                "budget_level": trip_analysis.budget_level if trip_analysis else "Moderate",
                "budget": trip_req.budget,
                "budget_per_day": trip_analysis.budget_per_day if trip_analysis else 0,
                "travelers": trip_req.travelers,
                "traveler_context": travel_prefs.traveler_context if travel_prefs else f"{trip_req.travelers} traveler(s)",
                "travel_style": trip_analysis.travel_style if trip_analysis else "Standard",
                "accommodation_expectation": trip_analysis.accommodation_expectation if trip_analysis else "Standard",
                "accommodation_preferences": travel_prefs.accommodation_preferences if travel_prefs else "Standard",
                "travel_mood": travel_prefs.travel_mood if travel_prefs else "Flexible",
                "pace": travel_prefs.pace if travel_prefs else "Standard",
                "combined_constraints": "; ".join(profile.combined_constraints) if profile.combined_constraints else "None",
                "hotels_list_text": hotels_list_text
            }

            resp: LLMHotelRankingResponse = await chain.ainvoke(prompt_input)

            ranked_hotels: List[RankedHotel] = []
            for ev in resp.evaluations:
                real_hotel = hotel_by_id.get(ev.hotel_id)
                if real_hotel:
                    ranked_hotels.append(RankedHotel(
                        hotel=real_hotel,
                        relevance_score=max(0, min(100, ev.relevance_score)),
                        relevance_level=ev.relevance_level if ev.relevance_level in ["high", "medium", "low"] else "medium",
                        matched_preferences=ev.matched_preferences or [real_hotel.accommodation_type or "Hotel"],
                        suitability_reason=ev.suitability_reason,
                        potential_considerations=ev.potential_considerations or ["Contact venue for current seasonal rates."]
                    ))

            # Include any unranked venues via heuristic fallback
            evaluated_ids = {r.hotel.hotel_id for r in ranked_hotels}
            for h in eval_hotels:
                if h.hotel_id not in evaluated_ids:
                    ranked_hotels.append(RankedHotel(
                        hotel=h,
                        relevance_score=60,
                        relevance_level="medium",
                        matched_preferences=[h.accommodation_type or "Hotel"],
                        suitability_reason=f"Verified {h.accommodation_type.lower() if h.accommodation_type else 'stay'} in {trip_req.destination}.",
                        potential_considerations=["Standard property check-in and booking policies."]
                    ))

            ranked_hotels.sort(key=lambda x: x.relevance_score, reverse=True)
            return ranked_hotels

        except Exception as e:
            logger.warning(f"Groq hotel ranking error: {e}. Falling back to heuristic ranking.")
            return build_heuristic_hotel_ranking(hotels, profile)

hotel_ranker = HotelRanker()
