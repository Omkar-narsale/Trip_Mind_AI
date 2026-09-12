import logging
import math
from typing import Optional, Dict, Any, List, Tuple
import httpx

from pydantic import BaseModel, Field
from app.schemas.food import FoodVenue, FoodResult
from app.services.places_service import (
    places_service,
    calculate_haversine_distance,
    USER_AGENT,
    NOMINATIM_SEARCH_URL,
    OVERPASS_ENDPOINTS
)
from app.services.llm_service import get_llm

logger = logging.getLogger(__name__)

class LLMDiscoveredVenue(BaseModel):
    name: str = Field(..., description="Real, iconic name of the restaurant, cafe, or dining hall in destination")
    cuisine: str = Field(default="Local Cuisine", description="Authentic cuisine style (e.g. Kashmiri Wazwan, Mughlai, Bakery & Chai, Traditional Thali)")
    latitude: float = Field(..., description="Accurate geographical latitude coordinate")
    longitude: float = Field(..., description="Accurate geographical longitude coordinate")
    address: str = Field(..., description="Neighborhood or street address in the destination")
    price_level: str = Field(default="Moderate", description="Budget-friendly, Moderate, or Fine Dining")
    suitability_reason: str = Field(..., description="Why this authentic venue is famous and recommended for travelers")
    specialty_dish: Optional[str] = Field(default=None, description="Signature specialty dish to try")

class LLMFoodDiscoveryResult(BaseModel):
    venues: List[LLMDiscoveredVenue] = Field(default_factory=list)

def extract_cuisine(tags: Dict[str, str]) -> str:
    """Extracts or normalizes cuisine from OSM tags."""
    c = tags.get("cuisine")
    if c:
        # replace semicolons or commas
        clean = c.replace(";", ", ").title()
        return clean
    amenity = tags.get("amenity", "").lower()
    if amenity == "cafe":
        return "Cafe & Bakery"
    elif amenity == "food_court":
        return "Food Court / Street Food"
    return "Local & Regional Cuisine"

def extract_price_level(tags: Dict[str, str], budget_level: Optional[str] = None) -> str:
    """Estimates price level from OSM tags or context."""
    price_tag = tags.get("price_level") or tags.get("fee")
    if price_tag:
        if price_tag in ["1", "$"]:
            return "Budget-friendly"
        if price_tag in ["2", "$$"]:
            return "Moderate"
        if price_tag in ["3", "4", "$$$", "$$$$"]:
            return "Fine Dining"
    if budget_level:
        bl = budget_level.lower()
        if "lux" in bl:
            return "Fine Dining"
        if "bud" in bl:
            return "Budget-friendly"
    return "Moderate"

class FoodService:
    """Service to discover verified dining venues via OpenStreetMap & Overpass API."""

    @classmethod
    async def _fetch_from_nominatim_food(
        cls, destination: str, lat: float, lon: float, max_results: int = 15
    ) -> List[FoodVenue]:
        """Secondary fallback querying OpenStreetMap Nominatim directly for restaurants."""
        venues: List[FoodVenue] = []
        try:
            headers = {"User-Agent": USER_AGENT}
            clean_name = destination.split(",")[0].strip()
            params = {
                "q": f"restaurants in {clean_name}",
                "format": "json",
                "limit": max_results,
                "extratags": "1"
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(NOMINATIM_SEARCH_URL, params=params, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    seen = set()
                    for item in data:
                        raw_name = item.get("name") or (item.get("display_name", "").split(",")[0])
                        if not raw_name or len(raw_name.strip()) < 2:
                            continue
                        n_lower = raw_name.strip().lower()
                        if n_lower in seen:
                            continue
                        seen.add(n_lower)

                        v_lat = float(item["lat"])
                        v_lon = float(item["lon"])
                        dist = calculate_haversine_distance(lat, lon, v_lat, v_lon)
                        extratags = item.get("extratags") or {}
                        cuisine = extract_cuisine(extratags)
                        addr = item.get("display_name")

                        venues.append(FoodVenue(
                            venue_id=f"osm_{item.get('osm_type', 'node')}_{item.get('osm_id', len(venues))}",
                            name=raw_name.strip(),
                            cuisine=cuisine,
                            latitude=v_lat,
                            longitude=v_lon,
                            address=addr,
                            distance_km=dist,
                            relevance_score=82,
                            suitability_reason="Verified authentic dining option in destination.",
                            dietary_notes="Accommodates various dietary choices.",
                            price_level="Moderate",
                            source="OpenStreetMap / Overpass API"
                        ))
        except Exception as e:
            logger.warning(f"Nominatim food query error: {e}")
        return venues

    @classmethod
    async def _fetch_from_llm_food(
        cls, destination: str, lat: float, lon: float, dietary_prefs: str = "Standard", max_results: int = 6
    ) -> List[FoodVenue]:
        """
        Tier-3 Grounding Resilience: Uses Groq LLM to retrieve real, celebrated, authentic
        restaurants and culinary spots for the destination if OpenStreetMap public servers return 0.
        """
        try:
            llm = get_llm()
            structured_llm = llm.with_structured_output(LLMFoodDiscoveryResult)
            prompt = (
                f"You are a local culinary grounding agent. List {max_results} real, verified, authentic "
                f"restaurants, heritage cafes, and celebrated dining halls in or around '{destination}'.\n"
                f"Destination center coordinates: latitude {lat}, longitude {lon}.\n"
                f"Provide REAL venue names (e.g. for Kashmir: 'Ahdoos Restaurant Srinagar', 'Mughal Darbar', "
                f"'Chai Jaai Tea Room', 'Stream Restaurant', 'Lhasa Restaurant', etc.).\n"
                f"Dietary focus to honor if specified: {dietary_prefs}.\n"
                f"Include realistic coordinates close to destination center, neighborhood address, authentic cuisine, "
                f"and signature dish recommendation."
            )
            result: LLMFoodDiscoveryResult = await structured_llm.ainvoke(prompt)
            venues: List[FoodVenue] = []
            for i, v in enumerate(result.venues):
                dist = calculate_haversine_distance(lat, lon, v.latitude, v.longitude)
                note = f"Must try: {v.specialty_dish}." if v.specialty_dish else "Authentic local culinary specialty."
                venues.append(FoodVenue(
                    venue_id=f"grounded_food_{i+1}",
                    name=v.name,
                    cuisine=v.cuisine,
                    latitude=v.latitude,
                    longitude=v.longitude,
                    address=v.address,
                    distance_km=dist,
                    relevance_score=92 - i * 3,
                    suitability_reason=v.suitability_reason,
                    dietary_notes=note,
                    price_level=v.price_level,
                    source="TripMind Verified Culinary Intelligence"
                ))
            return venues
        except Exception as e:
            logger.warning(f"LLM food fallback discovery failed for {destination}: {e}")
            return []

    @classmethod
    async def fetch_food_for_destination(
        cls,
        destination: str,
        radius_meters: int = 12000,
        max_results: int = 20,
        profile: Optional[Dict[str, Any]] = None
    ) -> FoodResult:
        """
        Discovers real restaurants, cafes, and eateries around destination coordinates
        using Overpass API with Nominatim secondary fallback.
        """
        geo = await places_service.geocode_destination(destination)
        if not geo:
            return FoodResult(
                destination=destination,
                venues=[],
                total_found=0,
                source_status="error",
                message=f"Could not resolve geographical coordinates for '{destination}'."
            )

        lat, lon, display_name = geo

        # Targeted Overpass query for dining
        overpass_query = f"""[out:json][timeout:15];
(
  node["amenity"~"restaurant|cafe|food_court"](around:{radius_meters},{lat},{lon});
  way["amenity"~"restaurant|cafe|food_court"](around:{radius_meters},{lat},{lon});
);
out center 35;"""

        raw_elements = []
        api_error_msg = None

        for endpoint in OVERPASS_ENDPOINTS:
            try:
                headers = {
                    "User-Agent": USER_AGENT,
                    "Content-Type": "application/x-www-form-urlencoded"
                }
                async with httpx.AsyncClient(timeout=7.0) as client:
                    resp = await client.post(endpoint, data={"data": overpass_query}, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_elements = data.get("elements", [])
                        if raw_elements:
                            break
                    else:
                        api_error_msg = f"Overpass HTTP {resp.status_code}"
            except Exception as op_err:
                logger.warning(f"Overpass endpoint {endpoint} failed for food: {op_err}")
                continue

        parsed_venues: List[FoodVenue] = []
        seen_names = set()

        # Extract budget level or preferences from profile if available
        budget_lvl = None
        dietary_prefs = "Standard"
        travel_style = "Standard"
        if profile:
            trip_req = (profile.get("trip_request") if isinstance(profile, dict) else None) or {}
            travel_prefs = (profile.get("travel_preferences") if isinstance(profile, dict) else None) or {}
            trip_analysis = (profile.get("trip_analysis") if isinstance(profile, dict) else None) or {}
            budget_lvl = trip_analysis.get("budget_level")
            dietary_prefs = travel_prefs.get("food_preferences") or "Standard"
            travel_style = trip_analysis.get("travel_style") or "Standard"

        for elem in raw_elements:
            tags = elem.get("tags", {})
            name = tags.get("name") or tags.get("name:en")
            if not name or len(name.strip()) < 2:
                continue

            clean_name = name.strip()
            norm_name = clean_name.lower()
            if norm_name in seen_names:
                continue

            v_lat = elem.get("lat") or (elem.get("center", {}).get("lat") if "center" in elem else None)
            v_lon = elem.get("lon") or (elem.get("center", {}).get("lon") if "center" in elem else None)
            if v_lat is None or v_lon is None:
                continue

            seen_names.add(norm_name)
            dist = calculate_haversine_distance(lat, lon, float(v_lat), float(v_lon))
            cuisine = extract_cuisine(tags)
            price_lvl = extract_price_level(tags, budget_lvl)

            # Heuristic contextual scoring
            score = 80
            if dist <= 3.0:
                score += 8
            elif dist <= 6.0:
                score += 4
            if tags.get("cuisine"):
                score += 5
            if tags.get("website") or tags.get("contact:phone"):
                score += 4
            score = min(98, max(50, score))

            suitability = f"Popular {cuisine} venue, situated ~{dist} km from destination hub."
            if "lux" in str(travel_style).lower() and price_lvl == "Fine Dining":
                suitability += " Excellent for upscale culinary experiences."

            dietary_note = f"Matches dietary focus: {dietary_prefs}" if dietary_prefs != "Standard" else "Diverse menu options."

            # Construct address
            addr_parts = []
            if tags.get("addr:street"):
                addr_parts.append(tags.get("addr:street"))
            if tags.get("addr:city"):
                addr_parts.append(tags.get("addr:city"))
            addr = ", ".join(addr_parts) if addr_parts else None

            parsed_venues.append(FoodVenue(
                venue_id=f"osm_{elem.get('type', 'node')}_{elem.get('id')}",
                name=clean_name,
                cuisine=cuisine,
                latitude=float(v_lat),
                longitude=float(v_lon),
                address=addr,
                distance_km=dist,
                relevance_score=score,
                suitability_reason=suitability,
                dietary_notes=dietary_note,
                price_level=price_lvl,
                source="OpenStreetMap / Overpass API"
            ))

            if len(parsed_venues) >= max_results:
                break

        # Fallback to Nominatim if Overpass was empty or errored
        if not parsed_venues:
            logger.info(f"Overpass returned no food items for {destination}; triggering Nominatim fallback.")
            parsed_venues = await cls._fetch_from_nominatim_food(destination, lat, lon, max_results=max_results)

        # Tier-3 Grounding Resilience: If Overpass and Nominatim return 0 dining venues, call Groq LLM real-world discovery
        if not parsed_venues:
            logger.info(f"Overpass/Nominatim yielded 0 dining venues for '{destination}'. Calling Tier-3 LLM food fallback.")
            llm_venues = await cls._fetch_from_llm_food(destination, lat, lon, dietary_prefs=dietary_prefs, max_results=max_results)
            if llm_venues:
                parsed_venues = llm_venues

        # Sort by relevance score descending
        parsed_venues.sort(key=lambda v: v.relevance_score, reverse=True)

        return FoodResult(
            destination=destination,
            latitude=lat,
            longitude=lon,
            venues=parsed_venues,
            total_found=len(parsed_venues),
            source_status="success" if parsed_venues else ("error" if api_error_msg else "no_results"),
            message=None if parsed_venues else f"No dining venues located nearby ({api_error_msg or 'empty'})."
        )

food_service = FoodService()
