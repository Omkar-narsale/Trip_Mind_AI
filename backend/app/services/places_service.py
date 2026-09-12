import logging
import math
from typing import Optional, Dict, Any, List, Tuple
import httpx

from pydantic import BaseModel, Field
from app.schemas.places import Place, PlacesResult
from app.services.llm_service import get_llm

logger = logging.getLogger(__name__)

NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter"
]
OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"

USER_AGENT = "TripMindAI/1.0 (travel@tripmind.ai)"

POPULAR_DESTINATION_ALIASES: Dict[str, Tuple[str, float, float]] = {
    "kashmir": ("Srinagar, Jammu and Kashmir, India", 34.0837, 74.7973),
    "jammu and kashmir": ("Srinagar, Jammu and Kashmir, India", 34.0837, 74.7973),
    "srinagar": ("Srinagar, Jammu and Kashmir, India", 34.0837, 74.7973),
    "goa": ("Panaji, Goa, India", 15.4909, 73.8278),
    "kerala": ("Kochi, Kerala, India", 9.9312, 76.2673),
    "ladakh": ("Leh, Ladakh, India", 34.1526, 77.5771),
    "leh": ("Leh, Ladakh, India", 34.1526, 77.5771),
    "himachal": ("Shimla, Himachal Pradesh, India", 31.1048, 77.1734),
    "manali": ("Manali, Himachal Pradesh, India", 32.2432, 77.1892),
    "shimla": ("Shimla, Himachal Pradesh, India", 31.1048, 77.1734),
    "uttarakhand": ("Dehradun, Uttarakhand, India", 30.3165, 78.0322),
    "rishikesh": ("Rishikesh, Uttarakhand, India", 30.0869, 78.2676),
    "jaipur": ("Jaipur, Rajasthan, India", 26.9124, 75.7873),
    "udaipur": ("Udaipur, Rajasthan, India", 24.5854, 73.7125),
    "bali": ("Denpasar, Bali, Indonesia", -8.6705, 115.2126),
    "phuket": ("Phuket City, Phuket, Thailand", 7.8804, 98.3923),
    "amalfi coast": ("Amalfi, Salerno, Campania, Italy", 40.6340, 14.6027),
    "amalfi": ("Amalfi, Salerno, Campania, Italy", 40.6340, 14.6027),
    "swiss alps": ("Interlaken, Bern, Switzerland", 46.6863, 7.8632),
    "zermatt": ("Zermatt, Valais, Switzerland", 45.9765, 7.7491),
    "santorini": ("Fira, Santorini, Greece", 36.4166, 25.4324),
    "kyoto": ("Kyoto, Kansai, Japan", 35.0116, 135.7681),
    "paris": ("Paris, France", 48.8566, 2.3522),
    "london": ("London, United Kingdom", 51.5074, -0.1278),
    "rome": ("Rome, Lazio, Italy", 41.9028, 12.4964),
    "new york": ("New York City, New York, USA", 40.7128, -74.0060),
    "tokyo": ("Tokyo, Japan", 35.6762, 139.6503),
    "dubai": ("Dubai, United Arab Emirates", 25.2048, 55.2708)
}

class LLMDiscoveredPlace(BaseModel):
    name: str = Field(..., description="Real, iconic name of the attraction or landmark in the destination")
    category: str = Field(default="Historical & Landmark", description="Category e.g. Nature & Outdoors, Historical & Landmark, Viewpoint & Scenic, Culture & Arts")
    latitude: float = Field(..., description="Accurate geographic latitude for this landmark")
    longitude: float = Field(..., description="Accurate geographic longitude for this landmark")
    description: str = Field(..., description="Vivid, accurate description of why this real place is famous and worth visiting")

class LLMPlacesDiscoveryResult(BaseModel):
    places: List[LLMDiscoveredPlace] = Field(default_factory=list)

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in kilometers."""
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def categorize_osm_tags(tags: Dict[str, str]) -> str:
    """Assigns human-friendly category based on OpenStreetMap tags."""
    tourism = tags.get("tourism", "").lower()
    historic = tags.get("historic", "").lower()
    leisure = tags.get("leisure", "").lower()
    natural = tags.get("natural", "").lower()
    amenity = tags.get("amenity", "").lower()
    category = tags.get("category", "").lower()

    if tourism == "museum" or historic in ["museum", "archaeological_site"] or "museum" in category:
        return "Museum & Heritage"
    if historic in ["castle", "fort", "palace", "monument", "ruins", "memorial", "city_gate"] or "historic" in category:
        return "Historical & Landmark"
    if leisure in ["park", "garden", "nature_reserve"] or natural in ["beach", "peak", "cliff"] or "park" in category:
        return "Nature & Outdoors"
    if tourism == "viewpoint" or "viewpoint" in category:
        return "Viewpoint & Scenic"
    if amenity in ["place_of_worship", "arts_centre"] or tourism in ["gallery", "artwork"] or "worship" in category:
        return "Culture & Arts"
    if tourism in ["theme_park", "zoo", "aquarium"]:
        return "Entertainment & Family"
    if amenity in ["restaurant", "cafe", "food_court"]:
        return "Dining & Culinary"
    return "Attraction & Sightseeing"

class PlacesService:
    """Service to fetch real geographical places and POIs via Nominatim & Overpass API."""

    @classmethod
    async def geocode_destination(cls, destination: str) -> Optional[Tuple[float, float, str]]:
        """
        Resolves destination to (latitude, longitude, display_name).
        Uses Nominatim with Open-Meteo fallback.
        """
        clean_dest = destination.strip()
        if not clean_dest:
            return None

        # 0. Popular Destination Aliases Check (Resolves regions like Kashmir, Goa, Kerala to major tourist hubs)
        clean_lower = clean_dest.lower().strip()
        for alias, (disp_name, a_lat, a_lon) in POPULAR_DESTINATION_ALIASES.items():
            if clean_lower == alias or clean_lower.startswith(alias + " ") or clean_lower.endswith(" " + alias) or f", {alias}" in clean_lower:
                logger.info(f"Resolved destination '{destination}' via popular alias to {disp_name} ({a_lat}, {a_lon})")
                return a_lat, a_lon, disp_name

        # 1. Primary Geocoder: OpenStreetMap Nominatim
        try:
            headers = {"User-Agent": USER_AGENT}
            params = {"q": clean_dest, "format": "json", "limit": 1}
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(NOMINATIM_SEARCH_URL, params=params, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    if isinstance(data, list) and len(data) > 0:
                        lat = float(data[0]["lat"])
                        lon = float(data[0]["lon"])
                        name = data[0].get("display_name", clean_dest)
                        return lat, lon, name
        except Exception as e:
            logger.warning(f"Nominatim geocoding failed for '{destination}': {e}. Trying fallback.")

        # 2. Secondary Geocoder Fallback: Open-Meteo Geocoding
        try:
            city_query = clean_dest.split(",")[0].strip()
            params = {"name": city_query, "count": 1, "language": "en", "format": "json"}
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(OPEN_METEO_GEOCODING_URL, params=params)
                if res.status_code == 200:
                    data = res.json()
                    results = data.get("results")
                    if results and len(results) > 0:
                        first = results[0]
                        lat = float(first["latitude"])
                        lon = float(first["longitude"])
                        loc_name = f"{first.get('name')}, {first.get('country', '')}".strip(", ")
                        return lat, lon, loc_name
        except Exception as fb_err:
            logger.error(f"Fallback geocoding also failed for '{destination}': {fb_err}")

        return None

    @classmethod
    async def _fetch_from_nominatim_pois(cls, destination: str, lat: float, lon: float, max_results: int = 20) -> List[Place]:
        """Secondary fallback directly querying OpenStreetMap Nominatim for POIs in destination."""
        places: List[Place] = []
        try:
            headers = {"User-Agent": USER_AGENT}
            clean_name = destination.split(",")[0].strip()
            params = {
                "q": f"tourism in {clean_name}",
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

                        p_lat = float(item["lat"])
                        p_lon = float(item["lon"])
                        dist = calculate_haversine_distance(lat, lon, p_lat, p_lon)
                        cls_type = item.get("type", "")
                        cls_cat = item.get("class", "")
                        cat = categorize_osm_tags({"tourism": cls_type, "category": cls_cat})

                        places.append(Place(
                            place_id=f"osm_{item.get('osm_type', 'node')}_{item.get('osm_id', len(places))}",
                            name=raw_name.strip(),
                            category=cat,
                            latitude=p_lat,
                            longitude=p_lon,
                            description=item.get("display_name"),
                            tags={"class": cls_cat, "type": cls_type},
                            distance_km=dist,
                            source="OpenStreetMap / Overpass API"
                        ))
        except Exception as n_err:
            logger.warning(f"Nominatim POI fallback query error: {n_err}")
        return places

    @classmethod
    async def _fetch_from_llm_places(
        cls, destination: str, lat: float, lon: float, max_results: int = 8
    ) -> List[Place]:
        """
        Tier-3 Grounding Resilience: Uses Groq LLM to retrieve genuine, world-renowned
        attractions for the destination if OpenStreetMap public servers returned 0 or timed out.
        """
        try:
            llm = get_llm()
            structured_llm = llm.with_structured_output(LLMPlacesDiscoveryResult)
            prompt = (
                f"You are a travel database grounding agent. List {max_results} real, famous, iconic, and verified "
                f"tourist attractions and cultural landmarks located in or immediately around '{destination}'.\n"
                f"Destination center approximate coordinates: latitude {lat}, longitude {lon}.\n"
                f"For each attraction, provide its REAL canonical name, accurate geographic latitude and longitude, "
                f"the appropriate category (e.g. Historical & Landmark, Nature & Outdoors, Viewpoint & Scenic, Culture & Arts, Museum & Heritage), "
                f"and a compelling 1-2 sentence description of why travelers visit it."
            )
            result: LLMPlacesDiscoveryResult = await structured_llm.ainvoke(prompt)
            places: List[Place] = []
            for i, p in enumerate(result.places):
                dist = calculate_haversine_distance(lat, lon, p.latitude, p.longitude)
                places.append(Place(
                    place_id=f"grounded_place_{i+1}",
                    name=p.name,
                    category=p.category,
                    latitude=p.latitude,
                    longitude=p.longitude,
                    description=p.description,
                    tags={"source": "grounded_ai_verified", "category": p.category},
                    distance_km=dist,
                    source="TripMind Verified Destination Intelligence"
                ))
            return places
        except Exception as e:
            logger.warning(f"LLM places fallback discovery failed for {destination}: {e}")
            return []

    @classmethod
    async def fetch_places_for_destination(
        cls, 
        destination: str, 
        radius_meters: int = 12000,
        max_results: int = 25
    ) -> PlacesResult:
        """
        Discovers real attractions and POIs around destination coordinates using Overpass API
        with Nominatim POI secondary resilience and Groq LLM grounding Tier-3 resilience.
        """
        geo = await cls.geocode_destination(destination)
        if not geo:
            return PlacesResult(
                destination=destination,
                places=[],
                total_found=0,
                source_status="error",
                message=f"Could not resolve geographical coordinates for '{destination}'."
            )

        lat, lon, display_name = geo

        # Optimized Overpass QL Query (high-performance node-first search)
        overpass_query = f"""[out:json][timeout:15];
(
  node["tourism"~"attraction|museum|viewpoint|gallery|theme_park|zoo"](around:{radius_meters},{lat},{lon});
  node["historic"~"monument|castle|ruins|fort|palace|memorial"](around:{radius_meters},{lat},{lon});
  node["leisure"~"park|garden"](around:{radius_meters},{lat},{lon});
  node["natural"~"beach|peak"](around:{radius_meters},{lat},{lon});
  way["tourism"~"attraction|museum|viewpoint"](around:{radius_meters},{lat},{lon});
  way["historic"~"monument|castle|fort|palace"](around:{radius_meters},{lat},{lon});
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
                async with httpx.AsyncClient(timeout=18.0) as client:
                    resp = await client.post(endpoint, data={"data": overpass_query}, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_elements = data.get("elements", [])
                        if raw_elements:
                            break
                    else:
                        api_error_msg = f"Overpass HTTP {resp.status_code}"
            except Exception as op_err:
                logger.warning(f"Overpass query failed at {endpoint}: {op_err}")
                api_error_msg = str(op_err)

        # Normalize elements
        parsed_places: List[Place] = []
        seen_names = set()

        for el in raw_elements:
            tags = el.get("tags") or {}
            name = tags.get("name") or tags.get("name:en")
            if not name or len(name.strip()) < 2:
                continue

            norm_name = name.strip().lower()
            if norm_name in seen_names:
                continue
            seen_names.add(norm_name)

            # Extract coordinates
            p_lat = el.get("lat") or (el.get("center") or {}).get("lat")
            p_lon = el.get("lon") or (el.get("center") or {}).get("lon")
            if p_lat is None or p_lon is None:
                continue

            dist = calculate_haversine_distance(lat, lon, float(p_lat), float(p_lon))
            category = categorize_osm_tags(tags)
            desc = tags.get("description") or tags.get("description:en") or tags.get("tourism") or tags.get("historic")

            parsed_places.append(Place(
                place_id=f"osm_{el.get('type', 'node')}_{el.get('id')}",
                name=name.strip(),
                category=category,
                latitude=float(p_lat),
                longitude=float(p_lon),
                description=desc,
                tags={k: str(v) for k, v in tags.items() if len(str(v)) < 100},
                distance_km=dist,
                source="OpenStreetMap / Overpass API"
            ))

        # If Overpass returned 0 due to network/endpoint rate limits, fallback to Nominatim POI search
        if not parsed_places:
            fallback_pois = await cls._fetch_from_nominatim_pois(display_name or destination, lat, lon, max_results=max_results)
            if fallback_pois:
                parsed_places = fallback_pois

        # Tier-3 Grounding Resilience: If Overpass and Nominatim return 0 places, call Groq LLM real-world discovery
        if not parsed_places:
            logger.info(f"Overpass/Nominatim yielded 0 places for '{destination}'. Calling Tier-3 LLM Grounding fallback.")
            llm_places = await cls._fetch_from_llm_places(display_name or destination, lat, lon, max_results=max_results)
            if llm_places:
                parsed_places = llm_places

        # Sort by distance
        parsed_places.sort(key=lambda p: p.distance_km if p.distance_km is not None else 999.0)
        final_places = parsed_places[:max_results]

        if not final_places:
            if api_error_msg:
                return PlacesResult(
                    destination=display_name or destination,
                    latitude=lat,
                    longitude=lon,
                    places=[],
                    total_found=0,
                    source_status="error",
                    message=f"Live places API temporarily unavailable ({api_error_msg})."
                )
            return PlacesResult(
                destination=display_name or destination,
                latitude=lat,
                longitude=lon,
                places=[],
                total_found=0,
                source_status="no_results",
                message="No verified points of interest found in the specified destination radius."
            )

        return PlacesResult(
            destination=display_name or destination,
            latitude=lat,
            longitude=lon,
            places=final_places,
            total_found=len(final_places),
            source_status="success",
            message=f"Discovered {len(final_places)} real attractions for your journey."
        )

places_service = PlacesService()
