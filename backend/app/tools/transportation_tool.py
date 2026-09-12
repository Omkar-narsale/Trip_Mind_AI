import logging
import math
from typing import List, Optional, Tuple, Dict, Any

from app.schemas.transportation import (
    LocationPoint,
    LocationType,
    LocationCluster
)
from app.schemas.places import PlacesResult, RankedAttraction
from app.schemas.hotel import HotelResult, RankedHotel

logger = logging.getLogger(__name__)

EARTH_RADIUS_KM = 6371.0

def calculate_haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates deterministic straight-line geodesic distance in kilometers
    between two coordinates using the Haversine formula.

    Note: Straight-line distance is NOT identical to road travel distance.
    Actual driving or walking distance will vary depending on road layouts and topography.
    """
    # Coordinate boundary sanity checks
    lat1 = max(-90.0, min(90.0, float(lat1)))
    lat2 = max(-90.0, min(90.0, float(lat2)))
    lon1 = max(-180.0, min(180.0, float(lon1)))
    lon2 = max(-180.0, min(180.0, float(lon2)))

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(EARTH_RADIUS_KM * c, 2)

class LocationPointsResult(dict):
    """Dict containing extracted location points that also supports 3-tuple unpacking."""
    def __iter__(self):
        yield self.get("destination_center")
        yield self.get("hotel")
        yield self.get("attractions", [])

def extract_location_points(
    destination: str,
    destination_coords: Optional[Tuple[float, float]] = None,
    dest_lat: Optional[float] = None,
    dest_lon: Optional[float] = None,
    hotel: Optional[Any] = None,
    ranked_hotels: Optional[List[Any]] = None,
    attractions: Optional[List[Any]] = None,
    ranked_attractions: Optional[List[Any]] = None
) -> LocationPointsResult:
    """
    Extracts validated location points from destination, lodging, and attractions.
    Supports both dict access (.get("hotel")) and 3-tuple unpacking (center, hotel, attrs).
    Ignores locations with missing or invalid coordinates.
    """
    if destination_coords:
        dest_lat, dest_lon = destination_coords

    center_point: Optional[LocationPoint] = None
    if dest_lat is not None and dest_lon is not None:
        try:
            center_point = LocationPoint(
                name=f"{destination} Center",
                latitude=float(dest_lat),
                longitude=float(dest_lon),
                location_type=LocationType.DESTINATION_CENTER,
                place_id="dest_center"
            )
        except Exception:
            pass

    # Extract primary hotel
    primary_hotel: Optional[LocationPoint] = None
    h_candidate = hotel
    if not h_candidate and ranked_hotels and len(ranked_hotels) > 0:
        h_candidate = ranked_hotels[0]

    if h_candidate:
        if isinstance(h_candidate, LocationPoint):
            primary_hotel = h_candidate
        else:
            if isinstance(h_candidate, dict):
                h_obj = h_candidate.get("hotel") or h_candidate
            else:
                h_obj = getattr(h_candidate, "hotel", h_candidate)

            h_name = (h_obj.get("name") if isinstance(h_obj, dict) else getattr(h_obj, "name", None))
            h_lat = (h_obj.get("latitude") if isinstance(h_obj, dict) else getattr(h_obj, "latitude", None))
            h_lon = (h_obj.get("longitude") if isinstance(h_obj, dict) else getattr(h_obj, "longitude", None))
            h_id = (h_obj.get("hotel_id") if isinstance(h_obj, dict) else getattr(h_obj, "hotel_id", None))

            if h_name and h_lat is not None and h_lon is not None:
                try:
                    primary_hotel = LocationPoint(
                        name=str(h_name),
                        latitude=float(h_lat),
                        longitude=float(h_lon),
                        location_type=LocationType.HOTEL,
                        place_id=str(h_id) if h_id else None
                    )
                except Exception:
                    pass

    # Extract attractions
    attr_inputs = attractions if attractions is not None else (ranked_attractions or [])
    attraction_points: List[LocationPoint] = []
    seen_names = set()

    for item in attr_inputs:
        if isinstance(item, LocationPoint):
            attraction_points.append(item)
            continue

        if isinstance(item, dict):
            p_obj = item.get("place") or item.get("attraction") or item
        else:
            p_obj = getattr(item, "place", getattr(item, "attraction", item))

        p_name = (p_obj.get("name") if isinstance(p_obj, dict) else getattr(p_obj, "name", None))
        p_lat = (p_obj.get("latitude") if isinstance(p_obj, dict) else getattr(p_obj, "latitude", None))
        p_lon = (p_obj.get("longitude") if isinstance(p_obj, dict) else getattr(p_obj, "longitude", None))
        p_id = (p_obj.get("place_id") if isinstance(p_obj, dict) else getattr(p_obj, "place_id", None))

        if p_name and p_lat is not None and p_lon is not None:
            norm = str(p_name).strip().lower()
            if norm not in seen_names:
                seen_names.add(norm)
                try:
                    attraction_points.append(LocationPoint(
                        name=str(p_name).strip(),
                        latitude=float(p_lat),
                        longitude=float(p_lon),
                        location_type=LocationType.ATTRACTION,
                        place_id=str(p_id) if p_id else None
                    ))
                except Exception:
                    pass

    return LocationPointsResult({
        "destination_center": center_point,
        "hotel": primary_hotel,
        "attractions": attraction_points
    })

def cluster_attractions(
    attractions: List[LocationPoint],
    threshold_km: float = 3.0,
    max_cluster_distance_km: Optional[float] = None
) -> List[LocationCluster]:
    """
    Groups attraction points into geographic clusters using proximity thresholds.
    Clusters locations within `threshold_km` of existing group centroids.
    """
    limit_km = max_cluster_distance_km if max_cluster_distance_km is not None else threshold_km
    if not attractions:
        return []

    clusters_raw: List[List[LocationPoint]] = []

    for point in attractions:
        assigned = False
        for group in clusters_raw:
            mean_lat = sum(p.latitude for p in group) / len(group)
            mean_lon = sum(p.longitude for p in group) / len(group)
            dist = calculate_haversine(point.latitude, point.longitude, mean_lat, mean_lon)
            if dist <= limit_km:
                group.append(point)
                assigned = True
                break

        if not assigned:
            clusters_raw.append([point])

    formatted_clusters: List[LocationCluster] = []
    for idx, group in enumerate(clusters_raw, 1):
        mean_lat = round(sum(p.latitude for p in group) / len(group), 5)
        mean_lon = round(sum(p.longitude for p in group) / len(group), 5)

        max_span = 0.0
        for p in group:
            d = calculate_haversine(mean_lat, mean_lon, p.latitude, p.longitude)
            if d > max_span:
                max_span = d

        primary_name = group[0].name
        if len(group) == 1:
            cluster_name = f"{primary_name} Area"
            note = "Individual destination highlight."
        else:
            cluster_name = f"{primary_name} & Surrounding Hub"
            note = f"Group of {len(group)} attractions situated within ~{round(max_span * 2, 1)} km of each other, ideal for combined exploration."

        formatted_clusters.append(LocationCluster(
            cluster_id=f"cluster_{idx}",
            cluster_name=cluster_name,
            locations=group,
            center_lat=mean_lat,
            center_lon=mean_lon,
            approximate_span_km=round(max_span * 2, 1),
            proximity_note=note
        ))

    return formatted_clusters

class TransportationTool:
    """Geographic distance calculation, location aggregation, and proximity clustering tool."""
    calculate_distance = staticmethod(calculate_haversine)
    extract_location_points = staticmethod(extract_location_points)
    cluster_attractions = staticmethod(cluster_attractions)

transportation_tool = TransportationTool()
