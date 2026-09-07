from typing import List, Optional
from app.schemas.trip import TripCreate
from app.schemas.trip_analysis import TripAnalysis
from app.schemas.travel_preferences import (
    ExtractedTravelPreferences,
    EnhancedTripProfile,
    EnhancedTripProfileResponse
)

class ProfileMergerService:
    @staticmethod
    def merge_profile(
        trip_request: TripCreate,
        trip_analysis: TripAnalysis,
        travel_preferences: Optional[ExtractedTravelPreferences] = None,
        warning: Optional[str] = None
    ) -> EnhancedTripProfileResponse:
        """
        Merges structured inputs, LLM trip analysis, and extracted natural language preferences
        into an EnhancedTripProfile without overwriting explicit form inputs.
        """
        # 1. Combine constraints without duplicates
        constraints_set = set()
        
        # From trip analysis
        for c in trip_analysis.planning_constraints:
            if c and c.strip():
                constraints_set.add(c.strip())

        # From extracted natural language preferences
        if travel_preferences:
            for c in travel_preferences.additional_constraints:
                if c and c.strip():
                    constraints_set.add(c.strip())
            
            if travel_preferences.accessibility_or_special_constraints:
                constraints_set.add(f"Accessibility requirement: {travel_preferences.accessibility_or_special_constraints.strip()}")

        combined_constraints = sorted(list(constraints_set))

        # 2. Build synthesized planning context
        planning_context = {
            "primary_travel_style": trip_analysis.travel_style,
            "budget_tier": trip_analysis.budget_level.value if hasattr(trip_analysis.budget_level, "value") else str(trip_analysis.budget_level),
            "travel_mood": travel_preferences.travel_mood if travel_preferences and travel_preferences.travel_mood else "Custom Exploration",
            "pace": travel_preferences.pace if travel_preferences and travel_preferences.pace else "Standard / Well-Paced",
            "party_dynamics": travel_preferences.traveler_context if travel_preferences and travel_preferences.traveler_context else f"{trip_request.travelers} traveler(s)",
            "explicit_interests": trip_request.preferences,
            "avoided_activities": travel_preferences.avoided_activities if travel_preferences else [],
            "culinary_direction": travel_preferences.food_preferences if travel_preferences and travel_preferences.food_preferences else "Open to local & diverse cuisines",
            "lodging_profile": travel_preferences.accommodation_preferences if travel_preferences and travel_preferences.accommodation_preferences else trip_analysis.accommodation_expectation
        }

        profile = EnhancedTripProfile(
            trip_request=trip_request,
            trip_analysis=trip_analysis,
            travel_preferences=travel_preferences,
            combined_constraints=combined_constraints,
            planning_context=planning_context
        )

        return EnhancedTripProfileResponse(
            success=True,
            profile=profile,
            warning=warning
        )

profile_merger_service = ProfileMergerService()
