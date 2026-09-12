import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class LocalSessionStore:
    """In-memory resilient fallback when Supabase is unconfigured or temporarily offline."""
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.trip_requests: Dict[str, Dict[str, Any]] = {}
        self.trip_profiles: Dict[str, Dict[str, Any]] = {}
        self.weather_results: Dict[str, Dict[str, Any]] = {}
        self.places_results: Dict[str, Dict[str, Any]] = {}
        self.hotel_results: Dict[str, Dict[str, Any]] = {}
        self.transportation_results: Dict[str, Dict[str, Any]] = {}
        self.food_results: Dict[str, Dict[str, Any]] = {}
        self.itinerary_results: Dict[str, Dict[str, Any]] = {}

    def create_session(self, status: str = "created", session_id: Optional[str] = None) -> Dict[str, Any]:
        s_id = session_id or str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        session = {
            "id": s_id,
            "status": status,
            "created_at": now,
            "updated_at": now
        }
        self.sessions[s_id] = session
        return session

    def update_session(self, session_id: str, status: str) -> bool:
        if session_id in self.sessions:
            self.sessions[session_id]["status"] = status
            self.sessions[session_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
            return True
        return False

    def save_trip_request(self, session_id: str, trip_data: Dict[str, Any]) -> bool:
        rec_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        self.trip_requests[session_id] = {
            "id": rec_id,
            "session_id": session_id,
            **trip_data,
            "created_at": now
        }
        return True

    def save_trip_profile(self, session_id: str, profile_data: Dict[str, Any]) -> bool:
        rec_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        self.trip_profiles[session_id] = {
            "id": rec_id,
            "session_id": session_id,
            "profile_data": profile_data,
            "created_at": now
        }
        return True

    def save_weather_result(self, session_id: str, weather_data: Dict[str, Any]) -> bool:
        rec_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        self.weather_results[session_id] = {
            "id": rec_id,
            "session_id": session_id,
            "weather_data": weather_data,
            "created_at": now
        }
        return True

    def save_places_result(self, session_id: str, places_data: Dict[str, Any]) -> bool:
        rec_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        self.places_results[session_id] = {
            "id": rec_id,
            "session_id": session_id,
            "places_data": places_data,
            "created_at": now
        }
        return True

    def save_hotel_result(self, session_id: str, hotel_data: Dict[str, Any]) -> bool:
        rec_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        self.hotel_results[session_id] = {
            "id": rec_id,
            "session_id": session_id,
            "hotel_data": hotel_data,
            "created_at": now
        }
        return True

    def save_transportation_result(self, session_id: str, transportation_data: Dict[str, Any]) -> bool:
        rec_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        self.transportation_results[session_id] = {
            "id": rec_id,
            "session_id": session_id,
            "transportation_data": transportation_data,
            "created_at": now
        }
        return True

    def save_food_result(self, session_id: str, food_data: Dict[str, Any]) -> bool:
        rec_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        self.food_results[session_id] = {
            "id": rec_id,
            "session_id": session_id,
            "food_data": food_data,
            "created_at": now
        }
        return True

    def save_itinerary_result(self, session_id: str, itinerary_data: Dict[str, Any]) -> bool:
        rec_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        self.itinerary_results[session_id] = {
            "id": rec_id,
            "session_id": session_id,
            "itinerary_data": itinerary_data,
            "created_at": now
        }
        return True

    def list_sessions(self) -> List[Dict[str, Any]]:
        results = []
        for s_id, s in sorted(self.sessions.items(), key=lambda item: item[1].get("created_at", ""), reverse=True):
            req = self.trip_requests.get(s_id) or {}
            results.append({
                "id": s_id,
                "status": s.get("status", "completed"),
                "created_at": s.get("created_at"),
                "updated_at": s.get("updated_at"),
                "destination": req.get("destination", "Unspecified Destination"),
                "origin": req.get("origin", "Unspecified Origin"),
                "departure_date": req.get("departure_date"),
                "return_date": req.get("return_date"),
                "travelers": req.get("travelers", 1),
                "budget": req.get("budget", 0)
            })
        return results

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        session = self.sessions.get(session_id)
        if not session:
            return None
        return {
            "session": session,
            "trip_request": self.trip_requests.get(session_id),
            "trip_profile": self.trip_profiles.get(session_id, {}).get("profile_data"),
            "weather_result": self.weather_results.get(session_id, {}).get("weather_data"),
            "places_result": self.places_results.get(session_id, {}).get("places_data"),
            "hotel_result": self.hotel_results.get(session_id, {}).get("hotel_data"),
            "transportation_result": self.transportation_results.get(session_id, {}).get("transportation_data"),
            "food_result": self.food_results.get(session_id, {}).get("food_data"),
            "itinerary_result": self.itinerary_results.get(session_id, {}).get("itinerary_data")
        }

local_store = LocalSessionStore()

class SupabaseService:
    """
    Cloud database service interacting with Supabase PostgreSQL via PostgREST REST API.
    Gracefully falls back to local session store when unconfigured or unreachable.
    Accurately tracks whether cloud persistence or local fallback occurred.
    """

    def __init__(self):
        self.url = (settings.SUPABASE_URL or "").strip().rstrip("/")
        self.key = (settings.SUPABASE_KEY or "").strip()
        self.cloud_sync_status: Dict[str, Dict[str, bool]] = {}

    def is_configured(self) -> bool:
        return bool(
            self.url and 
            self.key and 
            not self.key.startswith("postgresql://") and 
            not self.key.startswith("postgres://") and 
            "your-project" not in self.url
        )

    def _mark_cloud_status(self, session_id: str, table: str, success: bool):
        if session_id not in self.cloud_sync_status:
            self.cloud_sync_status[session_id] = {}
        self.cloud_sync_status[session_id][table] = success

    def is_session_cloud_persisted(self, session_id: str) -> bool:
        if not self.is_configured() or session_id not in self.cloud_sync_status:
            return False
        statuses = self.cloud_sync_status[session_id].values()
        return bool(statuses and all(statuses))

    def get_persistence_status(self, session_id: str) -> Dict[str, Any]:
        is_cloud = self.is_session_cloud_persisted(session_id)
        return {
            "supabase": is_cloud,
            "local_fallback": True,
            "status": "cloud_persisted" if is_cloud else "local_only"
        }

    def _get_headers(self) -> Dict[str, str]:
        return {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    async def create_session(self, status: str = "created", session_id: Optional[str] = None) -> Dict[str, Any]:
        """Creates a new planning session record in Supabase and mirrors in local store."""
        local_session = local_store.create_session(status, session_id=session_id)
        s_id = local_session["id"]
        logger.info("Planning session initialized with ID: %s (status: %s)", s_id, status)

        if not self.is_configured():
            logger.info("Supabase API key not configured; session %s saved to local store.", s_id)
            self._mark_cloud_status(s_id, "planning_sessions", False)
            return local_session

        try:
            endpoint = f"{self.url}/rest/v1/planning_sessions"
            payload = {"id": s_id, "status": status}
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(endpoint, json=payload, headers=self._get_headers())
                if res.status_code in [200, 201]:
                    data = res.json()
                    logger.info("Planning session %s persisted successfully to Supabase cloud.", s_id)
                    self._mark_cloud_status(s_id, "planning_sessions", True)
                    if isinstance(data, list) and data:
                        return data[0]
                    return local_session
                logger.error("Supabase create_session HTTP %s: %s for session %s.", res.status_code, res.text, s_id)
                self._mark_cloud_status(s_id, "planning_sessions", False)
        except Exception as e:
            logger.exception("Supabase create_session exception for session %s: %s", s_id, e)
            self._mark_cloud_status(s_id, "planning_sessions", False)

        return local_session

    async def ensure_session_exists(self, session_id: str, status: str = "planning") -> bool:
        """Ensures the parent planning_sessions row exists in Supabase before child inserts."""
        if session_id not in local_store.sessions:
            local_store.create_session(status=status, session_id=session_id)

        if not self.is_configured():
            return True

        try:
            endpoint = f"{self.url}/rest/v1/planning_sessions?id=eq.{session_id}&select=id"
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(endpoint, headers=self._get_headers())
                if res.status_code == 200:
                    data = res.json()
                    if isinstance(data, list) and len(data) > 0:
                        return True
                
                insert_endpoint = f"{self.url}/rest/v1/planning_sessions"
                ins_res = await client.post(insert_endpoint, json={"id": session_id, "status": status}, headers=self._get_headers())
                return ins_res.status_code in [200, 201]
        except Exception as e:
            logger.warning("ensure_session_exists check error for session %s: %s", session_id, e)
            return False

    async def update_session_status(self, session_id: str, status: str) -> bool:
        """Updates the status of a planning session."""
        local_store.update_session(session_id, status)
        if not self.is_configured():
            return True

        try:
            endpoint = f"{self.url}/rest/v1/planning_sessions?id=eq.{session_id}"
            payload = {
                "status": status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.patch(endpoint, json=payload, headers=self._get_headers())
                if res.status_code in [200, 204]:
                    logger.info("Session %s status updated to '%s' in Supabase cloud.", session_id, status)
                    return True
                logger.error("Supabase update_session_status HTTP %s for session %s: %s", res.status_code, session_id, res.text)
        except Exception as e:
            logger.exception("Supabase update_session_status error for session %s: %s", session_id, e)

        return True

    async def save_trip_request(self, session_id: str, trip_data: Dict[str, Any]) -> bool:
        """Saves user trip input parameters."""
        local_store.save_trip_request(session_id, trip_data)
        logger.info("Saving trip request for session: %s", session_id)
        if not self.is_configured():
            self._mark_cloud_status(session_id, "trip_requests", False)
            return True

        try:
            await self.ensure_session_exists(session_id)
            endpoint = f"{self.url}/rest/v1/trip_requests"
            payload = {
                "session_id": session_id,
                "origin": trip_data.get("origin", ""),
                "destination": trip_data.get("destination", ""),
                "departure_date": str(trip_data.get("departure_date", "")),
                "return_date": str(trip_data.get("return_date", "")),
                "travelers": int(trip_data.get("travelers", 1)),
                "budget": float(trip_data.get("budget", 0)),
                "preferences": trip_data.get("preferences", []),
                "additional_instructions": trip_data.get("additional_instructions")
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(endpoint, json=payload, headers=self._get_headers())
                if res.status_code in [200, 201]:
                    logger.info("Trip request persisted successfully for session: %s", session_id)
                    self._mark_cloud_status(session_id, "trip_requests", True)
                    return True
                logger.error("Supabase save_trip_request HTTP %s for session %s: %s", res.status_code, session_id, res.text)
                self._mark_cloud_status(session_id, "trip_requests", False)
        except Exception as e:
            logger.exception("Failed to persist trip request for session %s: %s", session_id, e)
            self._mark_cloud_status(session_id, "trip_requests", False)

        return True

    async def save_trip_profile(self, session_id: str, profile_data: Dict[str, Any]) -> bool:
        """Saves synthesized EnhancedTripProfile JSONB."""
        local_store.save_trip_profile(session_id, profile_data)
        logger.info("Saving trip profile for session: %s", session_id)
        if not self.is_configured():
            self._mark_cloud_status(session_id, "trip_profiles", False)
            return True

        try:
            await self.ensure_session_exists(session_id)
            endpoint = f"{self.url}/rest/v1/trip_profiles"
            payload = {
                "session_id": session_id,
                "profile_data": profile_data
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(endpoint, json=payload, headers=self._get_headers())
                if res.status_code in [200, 201]:
                    logger.info("Trip profile persisted successfully for session: %s", session_id)
                    self._mark_cloud_status(session_id, "trip_profiles", True)
                    return True
                logger.error("Supabase save_trip_profile HTTP %s for session %s: %s", res.status_code, session_id, res.text)
                self._mark_cloud_status(session_id, "trip_profiles", False)
        except Exception as e:
            logger.exception("Failed to persist trip profile for session %s: %s", session_id, e)
            self._mark_cloud_status(session_id, "trip_profiles", False)

        return True

    async def save_weather_result(self, session_id: str, weather_data: Dict[str, Any]) -> bool:
        """Saves live Open-Meteo weather JSONB."""
        local_store.save_weather_result(session_id, weather_data)
        logger.info("Saving weather result for session: %s", session_id)
        if not self.is_configured():
            self._mark_cloud_status(session_id, "weather_results", False)
            return True

        try:
            await self.ensure_session_exists(session_id)
            endpoint = f"{self.url}/rest/v1/weather_results"
            payload = {
                "session_id": session_id,
                "weather_data": weather_data
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(endpoint, json=payload, headers=self._get_headers())
                if res.status_code in [200, 201]:
                    logger.info("Weather result persisted successfully for session: %s", session_id)
                    self._mark_cloud_status(session_id, "weather_results", True)
                    return True
                logger.error("Supabase save_weather_result HTTP %s for session %s: %s", res.status_code, session_id, res.text)
                self._mark_cloud_status(session_id, "weather_results", False)
        except Exception as e:
            logger.exception("Failed to persist weather result for session %s: %s", session_id, e)
            self._mark_cloud_status(session_id, "weather_results", False)

        return True

    async def save_places_result(self, session_id: str, places_data: Dict[str, Any]) -> bool:
        """Saves OpenStreetMap attraction POIs JSONB."""
        local_store.save_places_result(session_id, places_data)
        logger.info("Saving places result for session: %s", session_id)
        if not self.is_configured():
            self._mark_cloud_status(session_id, "places_results", False)
            return True

        try:
            await self.ensure_session_exists(session_id)
            endpoint = f"{self.url}/rest/v1/places_results"
            payload = {
                "session_id": session_id,
                "places_data": places_data
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(endpoint, json=payload, headers=self._get_headers())
                if res.status_code in [200, 201]:
                    logger.info("Places result persisted successfully for session: %s", session_id)
                    self._mark_cloud_status(session_id, "places_results", True)
                    return True
                logger.error("Supabase save_places_result HTTP %s for session %s: %s", res.status_code, session_id, res.text)
                self._mark_cloud_status(session_id, "places_results", False)
        except Exception as e:
            logger.exception("Failed to persist places result for session %s: %s", session_id, e)
            self._mark_cloud_status(session_id, "places_results", False)

        return True

    async def save_hotel_result(self, session_id: str, hotel_data: Dict[str, Any]) -> bool:
        """Saves accommodation intelligence JSONB."""
        local_store.save_hotel_result(session_id, hotel_data)
        logger.info("Saving hotel result for session: %s", session_id)
        if not self.is_configured():
            self._mark_cloud_status(session_id, "hotel_results", False)
            return True

        try:
            await self.ensure_session_exists(session_id)
            endpoint = f"{self.url}/rest/v1/hotel_results"
            payload = {
                "session_id": session_id,
                "hotel_data": hotel_data
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(endpoint, json=payload, headers=self._get_headers())
                if res.status_code in [200, 201]:
                    logger.info("Hotel result persisted successfully for session: %s", session_id)
                    self._mark_cloud_status(session_id, "hotel_results", True)
                    return True
                logger.error("Supabase save_hotel_result HTTP %s for session %s: %s", res.status_code, session_id, res.text)
                self._mark_cloud_status(session_id, "hotel_results", False)
        except Exception as e:
            logger.exception("Failed to persist hotel result for session %s: %s", session_id, e)
            self._mark_cloud_status(session_id, "hotel_results", False)

        return True

    async def save_transportation_result(self, session_id: str, transportation_data: Dict[str, Any]) -> bool:
        """Saves transportation & route optimization intelligence JSONB."""
        local_store.save_transportation_result(session_id, transportation_data)
        logger.info("Saving transportation result for session: %s", session_id)
        if not self.is_configured():
            self._mark_cloud_status(session_id, "transportation_results", False)
            return True

        try:
            await self.ensure_session_exists(session_id)
            endpoint = f"{self.url}/rest/v1/transportation_results"
            payload = {
                "session_id": session_id,
                "transportation_data": transportation_data
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(endpoint, json=payload, headers=self._get_headers())
                if res.status_code in [200, 201]:
                    logger.info("Transportation result persisted successfully for session: %s", session_id)
                    self._mark_cloud_status(session_id, "transportation_results", True)
                    return True
                logger.error("Supabase save_transportation_result HTTP %s for session %s: %s", res.status_code, session_id, res.text)
                self._mark_cloud_status(session_id, "transportation_results", False)
        except Exception as e:
            logger.exception("Failed to persist transportation result for session %s: %s", session_id, e)
            self._mark_cloud_status(session_id, "transportation_results", False)

        return True

    async def save_food_result(self, session_id: str, food_data: Dict[str, Any]) -> bool:
        """Saves dining & food intelligence JSONB."""
        local_store.save_food_result(session_id, food_data)
        logger.info("Saving food result for session: %s", session_id)
        if not self.is_configured():
            self._mark_cloud_status(session_id, "food_results", False)
            return True

        try:
            await self.ensure_session_exists(session_id)
            endpoint = f"{self.url}/rest/v1/food_results"
            payload = {
                "session_id": session_id,
                "food_data": food_data
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(endpoint, json=payload, headers=self._get_headers())
                if res.status_code in [200, 201]:
                    logger.info("Food result persisted successfully for session: %s", session_id)
                    self._mark_cloud_status(session_id, "food_results", True)
                    return True
                logger.error("Supabase save_food_result HTTP %s for session %s: %s", res.status_code, session_id, res.text)
                self._mark_cloud_status(session_id, "food_results", False)
        except Exception as e:
            logger.exception("Failed to persist food result for session %s: %s", session_id, e)
            self._mark_cloud_status(session_id, "food_results", False)

        return True

    async def save_itinerary_result(self, session_id: str, itinerary_data: Dict[str, Any]) -> bool:
        """Saves Phase 9 day-wise itinerary JSONB."""
        local_store.save_itinerary_result(session_id, itinerary_data)
        logger.info("Saving itinerary result for session: %s", session_id)
        if not self.is_configured():
            self._mark_cloud_status(session_id, "itinerary_results", False)
            return True

        try:
            await self.ensure_session_exists(session_id)
            endpoint = f"{self.url}/rest/v1/itinerary_results"
            payload = {
                "session_id": session_id,
                "itinerary_data": itinerary_data
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(endpoint, json=payload, headers=self._get_headers())
                if res.status_code in [200, 201]:
                    logger.info("Itinerary result persisted successfully for session: %s", session_id)
                    self._mark_cloud_status(session_id, "itinerary_results", True)
                    return True
                logger.error("Supabase save_itinerary_result HTTP %s for session %s: %s", res.status_code, session_id, res.text)
                self._mark_cloud_status(session_id, "itinerary_results", False)
        except Exception as e:
            logger.exception("Failed to persist itinerary result for session %s: %s", session_id, e)
            self._mark_cloud_status(session_id, "itinerary_results", False)

        return True

    async def list_sessions(self) -> List[Dict[str, Any]]:
        """Retrieves list of planning sessions with core trip summary."""
        local_items = local_store.list_sessions()
        if not self.is_configured():
            return local_items

        try:
            endpoint = f"{self.url}/rest/v1/planning_sessions?select=id,status,created_at,updated_at,trip_requests(destination,origin,departure_date,return_date,travelers,budget)&order=created_at.desc&limit=30"
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(endpoint, headers=self._get_headers())
                if res.status_code == 200:
                    data = res.json()
                    formatted = []
                    seen_ids = set()
                    for row in data:
                        req_list = row.get("trip_requests") or []
                        req = req_list[0] if req_list else {}
                        s_id = row.get("id")
                        seen_ids.add(s_id)
                        formatted.append({
                            "id": s_id,
                            "status": row.get("status", "completed"),
                            "created_at": row.get("created_at"),
                            "updated_at": row.get("updated_at"),
                            "destination": req.get("destination", "Unspecified Destination"),
                            "origin": req.get("origin", "Unspecified Origin"),
                            "departure_date": req.get("departure_date"),
                            "return_date": req.get("return_date"),
                            "travelers": req.get("travelers", 1),
                            "budget": req.get("budget", 0)
                        })
                    for item in local_items:
                        if item["id"] not in seen_ids:
                            formatted.append(item)
                    return formatted
        except Exception as e:
            logger.warning("Supabase list_sessions error: %s. Falling back to local store.", e)

        return local_items

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves complete structured planning session with all child records."""
        if not self.is_configured():
            return local_store.get_session(session_id)

        try:
            endpoint = (
                f"{self.url}/rest/v1/planning_sessions"
                f"?id=eq.{session_id}"
                f"&select=id,status,created_at,updated_at,"
                f"trip_requests(*),trip_profiles(*),weather_results(*),places_results(*),hotel_results(*),transportation_results(*),food_results(*),itinerary_results(*)"
            )
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(endpoint, headers=self._get_headers())
                if res.status_code == 200:
                    data = res.json()
                    if isinstance(data, list) and len(data) > 0:
                        item = data[0]
                        req_list = item.get("trip_requests") or []
                        prof_list = item.get("trip_profiles") or []
                        wea_list = item.get("weather_results") or []
                        plc_list = item.get("places_results") or []
                        hot_list = item.get("hotel_results") or []
                        trn_list = item.get("transportation_results") or []
                        foo_list = item.get("food_results") or []
                        iti_list = item.get("itinerary_results") or []

                        return {
                            "session": {
                                "id": item.get("id"),
                                "status": item.get("status"),
                                "created_at": item.get("created_at"),
                                "updated_at": item.get("updated_at")
                            },
                            "trip_request": req_list[0] if req_list else None,
                            "trip_profile": prof_list[0].get("profile_data") if prof_list else None,
                            "weather_result": wea_list[0].get("weather_data") if wea_list else None,
                            "places_result": plc_list[0].get("places_data") if plc_list else None,
                            "hotel_result": hot_list[0].get("hotel_data") if hot_list else None,
                            "transportation_result": trn_list[0].get("transportation_data") if trn_list else None,
                            "food_result": foo_list[0].get("food_data") if foo_list else None,
                            "itinerary_result": iti_list[0].get("itinerary_data") if iti_list else None
                        }
        except Exception as e:
            logger.warning("Supabase get_session error: %s. Checking local store fallback.", e)

        return local_store.get_session(session_id)

supabase_service = SupabaseService()
