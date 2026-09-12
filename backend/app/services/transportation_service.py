import logging
from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

from app.schemas.transportation import (
    LocationType,
    TransportationMode,
    LocationPoint,
    LocationCluster,
    TransportationRecommendation,
    TransportationResult
)
from app.schemas.travel_preferences import EnhancedTripProfile
from app.schemas.hotel import Hotel
from app.schemas.places import Place, RankedAttraction
from app.tools.transportation_tool import (
    calculate_haversine,
    extract_location_points,
    cluster_attractions
)
from app.services.llm_service import get_llm

logger = logging.getLogger(__name__)

class LLMRecommendationItem(BaseModel):
    from_name: str = Field(..., description="Origin location or cluster name")
    to_name: str = Field(..., description="Destination location or cluster name")
    recommended_mode: str = Field(..., description="Walking, Cab / Taxi, Public Transit, Private Vehicle, or Mixed")
    suitability_reason: str = Field(..., description="Why this mode is recommended given the distance, group size, and pace")
    practical_transit_tips: List[str] = Field(default_factory=list, description="Practical travel guidance (e.g. metro lines, hailing cabs, comfortable shoes)")
    estimated_straight_line_km: float = Field(default=0.0, description="Straight line distance in km")

class LLMTransportationPlanResponse(BaseModel):
    summary: str = Field(..., description="High-level overview of the destination layout and transit strategy")
    hub_strategy: str = Field(..., description="How grouping attractions into geographic hubs saves travel time and fatigue")
    route_optimization_insights: List[str] = Field(default_factory=list, description="Actionable route sequencing and clustering insights")
    recommendations: List[LLMRecommendationItem] = Field(default_factory=list, description="Segment-specific transportation recommendations")
    accessibility_notes: Optional[str] = Field(default=None, description="Guidance for accessibility, senior, or mobility constraints if applicable")

SYSTEM_TRANSPORTATION_PROMPT = """You are the TripMind AI Transportation Intelligence and Route Optimization Engine.

You will receive:
1. Geographic clusters of real attractions and accommodation in a destination.
2. Exact deterministic straight-line distances (Haversine formula in km).
3. Traveler context: party size, travel pace, budget tier, and any accessibility/mobility constraints.

STRICT DIRECTIVES & DATA HONESTY:
1. NEVER INVENT PLACES, ADDRESSES, OR HOTELS. Only use the provided locations and clusters.
2. DATA HONESTY: Straight-line geographic distances are approximate and do NOT reflect exact road/transit network routing or real-time traffic.
3. ACCESSIBILITY OVERRIDE: If mobility constraints, elderly travelers, young children, or instructions like "avoid excessive walking" are present:
   - Deprioritize walking for distances > 0.5 km (500m).
   - Recommend Taxis / Cabs or accessible private transport instead.
   - Note accessibility tips explicitly.
4. PARTY SIZE LOGIC:
   - Groups >= 4 often find Cabs/Rideshares or Private Vehicles cheaper or more comfortable than individual public transit tickets.
   - Solo/Couples can easily leverage walking for short hops (< 1.5 km) and public transit.
5. DO NOT generate day-wise itineraries or book tickets. Provide transit mode recommendations, cluster sequencing advice, and route optimization insights."""

HUMAN_TRANSPORTATION_PROMPT = """Analyze these geographic clusters and provide transportation recommendations and route optimization insights:

=== DESTINATION & STAY ===
Destination: {destination}
Accommodation: {hotel_name} ({hotel_address})
Travelers: {travelers} ({traveler_context})
Travel Pace: {pace}
Budget Tier: {budget_tier}
Accessibility Constraints Detected: {accessibility_flag} ({accessibility_details})

=== GEOGRAPHIC CLUSTERS & DISTANCES ===
{clusters_summary_text}

=== KEY DISTANCE SEGMENTS (STRAIGHT-LINE HAVERSINE) ===
{segments_text}

Provide structured transportation recommendations and route optimization insights:"""

def detect_accessibility_constraints(profile: Optional[EnhancedTripProfile]) -> Tuple[bool, str]:
    """Detects whether accessibility or walking constraints apply from traveler profile."""
    if not profile:
        return False, "None"

    reasons = []
    
    # Check travel preferences
    if profile.travel_preferences:
        tp = profile.travel_preferences
        if tp.accessibility_or_special_constraints:
            reasons.append(tp.accessibility_or_special_constraints)
        if tp.transportation_preferences:
            t_pref = tp.transportation_preferences.lower()
            if any(term in t_pref for term in ["avoid walking", "minimal walking", "little walking", "mobility", "cab", "taxi", "private"]):
                reasons.append(tp.transportation_preferences)
        for c in (tp.additional_constraints or []):
            c_lower = c.lower()
            if any(term in c_lower for term in ["walking", "mobility", "wheelchair", "elderly", "senior", "physical"]):
                reasons.append(c)

    # Check combined constraints
    for c in (profile.combined_constraints or []):
        c_lower = c.lower()
        if any(term in c_lower for term in ["walk", "mobility", "wheelchair", "elderly", "senior", "knee"]):
            reasons.append(c)

    # Check party context / travelers
    req = profile.trip_request
    if req:
        ctx = (getattr(req, "traveler_context", None) or "").lower()
        if any(term in ctx for term in ["elderly", "senior", "infant", "toddler", "baby", "wheelchair", "mobility"]):
            reasons.append(f"Traveler context: {req.traveler_context}")
        inst = (getattr(req, "additional_instructions", None) or "").lower()
        if any(term in inst for term in ["avoid walking", "minimal walking", "little walking", "mobility", "wheelchair", "elderly", "senior", "knee"]):
            reasons.append(f"Instructions: {req.additional_instructions}")

    if reasons:
        # Deduplicate
        unique_reasons = list(dict.fromkeys(reasons))
        return True, "; ".join(unique_reasons)
    return False, "None"

def build_heuristic_transportation_plan(
    destination: str,
    hotel_point: Optional[LocationPoint],
    clusters: List[LocationCluster],
    segments: List[Dict[str, Any]],
    profile: Optional[EnhancedTripProfile],
    accessibility_applied: bool,
    accessibility_notes: Optional[str]
) -> TransportationResult:
    """Deterministic fallback when Groq LLM is unavailable or encounters errors."""
    travelers = profile.trip_request.travelers if profile and profile.trip_request else 2
    pace = "Moderate"
    if profile and profile.travel_preferences and profile.travel_preferences.pace:
        pace = profile.travel_preferences.pace
    elif profile and profile.trip_analysis:
        pace = getattr(profile.trip_analysis, "pace", "Moderate")
    
    recs: List[TransportationRecommendation] = []
    
    for seg in segments:
        dist = seg["distance_km"]
        from_loc = seg["from"]
        to_loc = seg["to"]
        
        # Determine transit mode deterministically
        if accessibility_applied and dist > 0.5:
            mode = TransportationMode.CAB_TAXI
            reason = f"Accessibility constraint active: cab/taxi is recommended for this {dist} km segment to avoid physical fatigue."
            tips = ["Request point-to-point drop-offs near the entrance", "Book licensed local taxis or app-based rideshares"]
        elif dist <= 1.2:
            mode = TransportationMode.WALKING
            reason = f"Short straight-line distance of {dist} km; highly walkable and ideal for exploring nearby streets."
            tips = ["Wear comfortable walking shoes", "Follow pedestrian-friendly thoroughfares"]
        elif dist <= 4.0:
            if travelers >= 3:
                mode = TransportationMode.CAB_TAXI
                reason = f"At {dist} km for a party of {travelers}, a cab/rideshare is often cost-effective and saves transit time."
                tips = ["Local rideshare or meter cabs are convenient for groups", "Avoid peak congestion hours where possible"]
            else:
                mode = TransportationMode.PUBLIC_TRANSIT
                reason = f"Moderate distance of {dist} km; local public transit (metro/bus) connects these areas efficiently."
                tips = ["Check for city transit cards or day passes", "Verify local metro/bus operational hours"]
        else:
            if travelers >= 4:
                mode = TransportationMode.PRIVATE_VEHICLE
                reason = f"Longer distance of {dist} km; a dedicated private car or arranged cab service provides comfort and flexibility for {travelers} travelers."
                tips = ["Consider pre-booking a private driver for full cluster exploration", "Consolidate visits into a single round trip"]
            else:
                mode = TransportationMode.CAB_TAXI
                reason = f"Distance of {dist} km between these hubs is best traversed via taxi or express transit to optimize your {pace.lower()} pace."
                tips = ["Use app-based hailing for transparent fare estimates", "Confirm drop-off points close to pedestrian entries"]

        recs.append(
            TransportationRecommendation(
                origin_name=from_loc,
                destination_name=to_loc,
                distance_km=round(dist, 2),
                recommended_mode=mode,
                suitability_reason=reason,
                practical_transit_tips=tips
            )
        )

    # Hub optimization insights
    insights = []
    if clusters:
        insights.append(f"Attractions naturally partition into {len(clusters)} geographic cluster(s) within {destination}.")
        for c in clusters:
            if len(c.attraction_names) > 1:
                insights.append(f"{c.cluster_name} contains {len(c.attraction_names)} sights within ~{round(c.cluster_radius_km, 1)} km. Visit these consecutively to eliminate cross-city transit.")
    if hotel_point and clusters:
        insights.append(f"Base your morning departure towards the nearest cluster first to minimize initial transit time.")

    summary = (
        f"Geographic transportation analysis for {destination} with {len(clusters)} attraction cluster(s). "
        f"Route recommendations prioritize low transit friction tailored for {travelers} traveler(s) at a {pace} pace."
    )
    if accessibility_applied:
        summary += " Strict accessibility overrides applied (walking deprioritized above 500m)."

    return TransportationResult(
        destination=destination,
        clusters=clusters,
        recommendations=recs,
        route_optimization_insights=insights,
        summary=summary,
        total_clusters=len(clusters),
        accessibility_applied=accessibility_applied,
        accessibility_notes=accessibility_notes
    )

class TransportationService:
    """Service to generate transportation recommendations and route optimization insights."""

    @classmethod
    async def generate_transportation_plan(
        cls,
        destination: str,
        destination_coords: Optional[Tuple[float, float]] = None,
        hotel: Optional[Any] = None,
        attractions: Optional[List[Any]] = None,
        profile: Optional[EnhancedTripProfile] = None
    ) -> TransportationResult:
        """Analyzes spatial layout and produces intelligent route recommendations."""
        # 1. Extract location points
        loc_points = extract_location_points(
            destination=destination,
            destination_coords=destination_coords,
            hotel=hotel,
            attractions=attractions or []
        )

        hotel_point = loc_points.get("hotel")
        dest_point = loc_points.get("destination_center")
        attraction_points = loc_points.get("attractions", [])

        # 2. Cluster attractions
        clusters = cluster_attractions(attraction_points, threshold_km=3.0)

        # 3. Build distance segments
        segments: List[Dict[str, Any]] = []

        # Hotel to Destination Center (if both exist)
        if hotel_point and dest_point:
            d = calculate_haversine(hotel_point.latitude, hotel_point.longitude, dest_point.latitude, dest_point.longitude)
            segments.append({
                "from": hotel_point.name,
                "to": f"{destination} Center",
                "distance_km": round(d, 2)
            })

        # Hotel to each cluster centroid
        if hotel_point:
            for c in clusters:
                d = calculate_haversine(hotel_point.latitude, hotel_point.longitude, c.centroid_latitude, c.centroid_longitude)
                segments.append({
                    "from": hotel_point.name,
                    "to": c.cluster_name,
                    "distance_km": round(d, 2)
                })
        elif dest_point:
            for c in clusters:
                d = calculate_haversine(dest_point.latitude, dest_point.longitude, c.centroid_latitude, c.centroid_longitude)
                segments.append({
                    "from": f"{destination} Center",
                    "to": c.cluster_name,
                    "distance_km": round(d, 2)
                })

        # Inter-cluster distances if multiple clusters
        if len(clusters) > 1:
            for i in range(len(clusters) - 1):
                c1 = clusters[i]
                c2 = clusters[i + 1]
                d = calculate_haversine(c1.centroid_latitude, c1.centroid_longitude, c2.centroid_latitude, c2.centroid_longitude)
                segments.append({
                    "from": c1.cluster_name,
                    "to": c2.cluster_name,
                    "distance_km": round(d, 2)
                })

        # Check accessibility constraints
        accessibility_applied, accessibility_details = detect_accessibility_constraints(profile)
        acc_notes = accessibility_details if accessibility_applied else None

        # If no clusters or segments, produce basic result
        if not clusters and not segments:
            return TransportationResult(
                destination=destination,
                clusters=[],
                recommendations=[],
                route_optimization_insights=["No geocoded attractions or accommodation available for route clustering."],
                summary=f"Transportation analysis for {destination}: Insufficient location data for clustering.",
                total_clusters=0,
                accessibility_applied=accessibility_applied,
                accessibility_notes=acc_notes
            )

        # Attempt Groq LLM structuring
        try:
            llm = get_llm()
            structured_llm = llm.with_structured_output(LLMTransportationPlanResponse)
            
            # Format text inputs
            cluster_text_lines = []
            for c in clusters:
                sights = ", ".join(c.attraction_names)
                cluster_text_lines.append(
                    f"- {c.cluster_name} (Radius: ~{round(c.cluster_radius_km, 1)} km, Sights: {sights})"
                )
            clusters_summary_text = "\n".join(cluster_text_lines) if cluster_text_lines else "Single central area."

            seg_text_lines = [
                f"- From '{s['from']}' to '{s['to']}': {s['distance_km']} km (straight-line)"
                for s in segments
            ]
            segments_text = "\n".join(seg_text_lines)

            h_name = hotel_point.name if hotel_point else "Not specified"
            h_addr = getattr(hotel_point, "address", None) or "Central area"
            travelers = profile.trip_request.travelers if (profile and profile.trip_request) else 2
            t_context = (
                getattr(profile.trip_request, "traveler_context", None)
                if (profile and profile.trip_request) else None
            ) or (
                getattr(profile.travel_preferences, "traveler_context", None)
                if (profile and profile.travel_preferences) else None
            ) or f"{travelers} traveler(s)"
            pace = "Moderate"
            if profile and profile.travel_preferences and profile.travel_preferences.pace:
                pace = profile.travel_preferences.pace
            elif profile and profile.trip_analysis:
                pace = getattr(profile.trip_analysis, "pace", "Moderate")
            raw_budget = profile.trip_analysis.budget_level if (profile and profile.trip_analysis) else "Moderate"
            budget_tier = getattr(raw_budget, "value", str(raw_budget))

            prompt = ChatPromptTemplate.from_messages([
                ("system", SYSTEM_TRANSPORTATION_PROMPT),
                ("human", HUMAN_TRANSPORTATION_PROMPT)
            ])

            chain = prompt | structured_llm
            result: LLMTransportationPlanResponse = await chain.ainvoke({
                "destination": destination,
                "hotel_name": h_name,
                "hotel_address": h_addr,
                "travelers": travelers,
                "traveler_context": t_context,
                "pace": pace,
                "budget_tier": budget_tier,
                "accessibility_flag": "YES" if accessibility_applied else "NO",
                "accessibility_details": accessibility_details,
                "clusters_summary_text": clusters_summary_text,
                "segments_text": segments_text
            })

            # Map LLM recommendations to Pydantic models
            recommendations: List[TransportationRecommendation] = []
            for item in result.recommendations:
                # Find matching segment distance if available
                dist = item.estimated_straight_line_km
                for s in segments:
                    if (s["from"] in item.from_name or item.from_name in s["from"]) and (s["to"] in item.to_name or item.to_name in s["to"]):
                        dist = s["distance_km"]
                        break

                # Parse TransportationMode enum safely
                mode_str = item.recommended_mode.lower()
                if "walk" in mode_str:
                    t_mode = TransportationMode.WALKING
                elif "cab" in mode_str or "taxi" in mode_str or "ride" in mode_str:
                    t_mode = TransportationMode.CAB_TAXI
                elif "public" in mode_str or "transit" in mode_str or "metro" in mode_str or "bus" in mode_str:
                    t_mode = TransportationMode.PUBLIC_TRANSIT
                elif "private" in mode_str or "car" in mode_str or "vehicle" in mode_str:
                    t_mode = TransportationMode.PRIVATE_VEHICLE
                else:
                    t_mode = TransportationMode.MIXED

                # Enforce accessibility override on LLM response if needed
                if accessibility_applied and dist > 0.5 and t_mode == TransportationMode.WALKING:
                    t_mode = TransportationMode.CAB_TAXI
                    item.suitability_reason += " (Adjusted from walking to Cab/Taxi for accessibility comfort)."

                recommendations.append(
                    TransportationRecommendation(
                        origin_name=item.from_name,
                        destination_name=item.to_name,
                        distance_km=round(dist, 2),
                        recommended_mode=t_mode,
                        suitability_reason=item.suitability_reason,
                        practical_transit_tips=item.practical_transit_tips
                    )
                )

            # Ensure all segments have at least one recommendation
            if not recommendations and segments:
                return build_heuristic_transportation_plan(
                    destination=destination,
                    hotel_point=hotel_point,
                    clusters=clusters,
                    segments=segments,
                    profile=profile,
                    accessibility_applied=accessibility_applied,
                    accessibility_notes=acc_notes
                )

            insights = result.route_optimization_insights or []
            if result.hub_strategy and result.hub_strategy not in insights:
                insights.insert(0, result.hub_strategy)

            return TransportationResult(
                destination=destination,
                clusters=clusters,
                recommendations=recommendations,
                route_optimization_insights=insights,
                summary=result.summary,
                total_clusters=len(clusters),
                accessibility_applied=accessibility_applied,
                accessibility_notes=result.accessibility_notes or acc_notes
            )

        except Exception as e:
            logger.warning(f"Groq transportation planning failed: {e}. Utilizing deterministic heuristic route engine.")
            return build_heuristic_transportation_plan(
                destination=destination,
                hotel_point=hotel_point,
                clusters=clusters,
                segments=segments,
                profile=profile,
                accessibility_applied=accessibility_applied,
                accessibility_notes=acc_notes
            )

transportation_service = TransportationService()
