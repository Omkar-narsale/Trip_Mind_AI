import math
import logging
from typing import List, Dict, Any, Tuple
import httpx

from app.schemas.routing import (
    Waypoint,
    RouteStep,
    RoutePreviewRequest,
    RoutePreviewResponse
)

logger = logging.getLogger(__name__)

class RoutingService:
    OSRM_BASE_URL = "https://router.project-osrm.org/route/v1"

    @staticmethod
    def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        r = 6371.0
        p1, p2 = math.radians(lat1), math.radians(lat2)
        dp = math.radians(lat2 - lat1)
        dl = math.radians(lon2 - lon1)
        a = math.sin(dp / 2)**2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return r * c

    def _generate_fallback_route(self, all_points: List[Waypoint], mode: str) -> RoutePreviewResponse:
        """Generates realistic geodesic corridor and maneuvers if live OSRM is unreachable."""
        total_dist = 0.0
        coords: List[List[float]] = []
        steps: List[RouteStep] = []

        for i in range(len(all_points) - 1):
            p1 = all_points[i]
            p2 = all_points[i + 1]
            seg_dist = self._haversine_km(p1.latitude, p1.longitude, p2.latitude, p2.longitude)
            total_dist += seg_dist

            # Linear interpolation for smoother polyline
            sub_steps = 8
            for s in range(sub_steps):
                t = s / sub_steps
                lat = p1.latitude + t * (p2.latitude - p1.latitude)
                lon = p1.longitude + t * (p2.longitude - p1.longitude)
                coords.append([round(lat, 6), round(lon, 6)])

            speed_kmh = 32.0 if mode == "driving" else 4.8
            seg_duration = (seg_dist / speed_kmh) * 60.0

            steps.append(RouteStep(
                instruction=f"Depart from {p1.name} and proceed towards {p2.name}",
                distance_km=round(seg_dist, 2),
                duration_min=round(seg_duration, 1),
                road_name=f"Corridor {p1.name} → {p2.name}"
            ))

        last = all_points[-1]
        coords.append([round(last.latitude, 6), round(last.longitude, 6)])
        steps.append(RouteStep(
            instruction=f"Arrive at destination: {last.name}",
            distance_km=0.0,
            duration_min=0.0,
            road_name="Arrival"
        ))

        total_dur = (total_dist / (32.0 if mode == "driving" else 4.8)) * 60.0

        return RoutePreviewResponse(
            origin=all_points[0],
            destination=all_points[-1],
            mode=mode,
            total_distance_km=round(total_dist, 2),
            total_duration_min=round(total_dur, 1),
            polyline_coords=coords,
            steps=steps,
            source="geodesic_fallback"
        )

    async def get_route_preview(self, req: RoutePreviewRequest) -> RoutePreviewResponse:
        """
        Queries OSRM API for turn-by-turn routing with realistic driving/walking coordinates.
        Falls back smoothly to geometric route synthesis if OSRM service is unavailable.
        """
        all_points = [req.origin] + req.waypoints + [req.destination]
        if len(all_points) < 2:
            raise ValueError("Route preview requires at least origin and destination points.")

        mode_profile = "driving" if req.mode.lower() == "driving" else "foot"
        coords_str = ";".join([f"{p.longitude:.6f},{p.latitude:.6f}" for p in all_points])
        url = f"{self.OSRM_BASE_URL}/{mode_profile}/{coords_str}?overview=full&geometries=geojson&steps=true"

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    routes = data.get("routes", [])
                    if routes:
                        r0 = routes[0]
                        geom_coords = r0.get("geometry", {}).get("coordinates", [])
                        # OSRM returns [lon, lat]; convert to Leaflet [lat, lon]
                        polyline_coords = [[round(c[1], 6), round(c[0], 6)] for c in geom_coords]

                        total_dist_km = round(r0.get("distance", 0.0) / 1000.0, 2)
                        total_dur_min = round(r0.get("duration", 0.0) / 60.0, 1)

                        steps: List[RouteStep] = []
                        legs = r0.get("legs", [])

                        for leg_idx, leg in enumerate(legs):
                            leg_origin_name = all_points[leg_idx].name if leg_idx < len(all_points) else "Origin"
                            leg_dest_name = all_points[leg_idx + 1].name if (leg_idx + 1) < len(all_points) else "Destination"

                            leg_steps = leg.get("steps", [])
                            if not leg_steps:
                                steps.append(RouteStep(
                                    instruction=f"Proceed from {leg_origin_name} to {leg_dest_name}",
                                    distance_km=round(leg.get("distance", 0.0) / 1000.0, 2),
                                    duration_min=round(leg.get("duration", 0.0) / 60.0, 1),
                                    road_name=f"{leg_origin_name} → {leg_dest_name}"
                                ))
                            else:
                                for s in leg_steps:
                                    dist_km = round(s.get("distance", 0.0) / 1000.0, 2)
                                    dur_min = round(s.get("duration", 0.0) / 60.0, 1)
                                    road = s.get("name") or "Main Road"
                                    maneuver = s.get("maneuver", {})
                                    m_type = maneuver.get("type", "turn")
                                    m_modifier = maneuver.get("modifier", "")

                                    if m_type == "depart":
                                        instr = f"Depart from {leg_origin_name} onto {road}"
                                    elif m_type == "arrive":
                                        instr = f"Arrive at {leg_dest_name}"
                                    elif m_modifier:
                                        instr = f"Turn {m_modifier} onto {road} ({dist_km} km)"
                                    else:
                                        instr = f"Continue onto {road} ({dist_km} km)"

                                    steps.append(RouteStep(
                                        instruction=instr,
                                        distance_km=dist_km,
                                        duration_min=dur_min,
                                        road_name=road
                                    ))

                        return RoutePreviewResponse(
                            origin=req.origin,
                            destination=req.destination,
                            mode=req.mode,
                            total_distance_km=total_dist_km,
                            total_duration_min=total_dur_min,
                            polyline_coords=polyline_coords,
                            steps=steps,
                            source="osrm"
                        )

        except Exception as e:
            logger.warning(f"OSRM routing request failed gracefully ({e}), generating synthesized corridor route.")

        # Fallback to intelligent corridor interpolation
        return self._generate_fallback_route(all_points, req.mode)

routing_service = RoutingService()
