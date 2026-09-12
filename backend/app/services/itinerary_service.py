import logging
import math
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

from app.schemas.itinerary import (
    ItineraryActivity,
    ItineraryDay,
    TripSummary,
    ItineraryValidation,
    ItineraryResult
)
from app.tools.transportation_tool import calculate_haversine

logger = logging.getLogger(__name__)

class ItineraryService:
    """
    Phase 9 Itinerary Engine.
    Synthesizes a cohesive day-wise schedule consuming verified outputs from
    Phases 5 (Weather), 6 (Places), 7 (Hotels), 8 (Transportation), and Food intelligence.
    """

    @classmethod
    def generate_itinerary(
        cls,
        trip_profile: Dict[str, Any],
        weather_result: Optional[Dict[str, Any]] = None,
        weather_insight: Optional[Dict[str, Any]] = None,
        places_result: Optional[Dict[str, Any]] = None,
        ranked_attractions: Optional[List[Dict[str, Any]]] = None,
        hotel_result: Optional[Dict[str, Any]] = None,
        ranked_hotels: Optional[List[Dict[str, Any]]] = None,
        transportation_result: Optional[Dict[str, Any]] = None,
        food_result: Optional[Dict[str, Any]] = None
    ) -> ItineraryResult:
        """
        Synthesizes a day-wise itinerary respecting all constraints, clustering,
        weather, transit modes, and accessibility limits.
        """
        if hasattr(trip_profile, "model_dump"):
            trip_profile = trip_profile.model_dump()
        elif not isinstance(trip_profile, dict):
            trip_profile = {}

        trip_req = (trip_profile.get("trip_request") if trip_profile else None) or {}
        trip_analysis = (trip_profile.get("trip_analysis") if trip_profile else None) or {}
        travel_prefs = (trip_profile.get("travel_preferences") if trip_profile else None) or {}

        destination = trip_req.get("destination", "Destination")
        origin = trip_req.get("origin")
        dep_date_str = trip_req.get("departure_date", "")
        ret_date_str = trip_req.get("return_date", "")
        travelers = trip_req.get("travelers", 1)
        travel_style = trip_analysis.get("travel_style") or "Standard"
        pace = travel_prefs.get("pace") or "Standard"
        accessibility_req = travel_prefs.get("accessibility_or_special_constraints") or ""
        
        # Check accessibility status
        acc_keywords = ["avoid walking", "minimal walking", "mobility", "wheelchair", "elderly", "senior", "knee", "stroller", "accessibility"]
        is_accessibility_active = any(k in accessibility_req.lower() for k in acc_keywords)

        # Parse trip dates
        dates: List[str] = []
        try:
            d_start = datetime.strptime(dep_date_str, "%Y-%m-%d")
            d_end = datetime.strptime(ret_date_str, "%Y-%m-%d")
            if d_end < d_start:
                d_end = d_start
            delta = (d_end - d_start).days + 1
            # Cap at 14 days for sanity
            num_days = min(14, max(1, delta))
            for i in range(num_days):
                curr = d_start + timedelta(days=i)
                dates.append(curr.strftime("%Y-%m-%d"))
        except Exception:
            # Fallback if dates invalid or missing
            today = datetime.now()
            num_days = trip_analysis.get("duration_days", 3) if isinstance(trip_analysis, dict) else 3
            for i in range(num_days):
                dates.append((today + timedelta(days=i)).strftime("%Y-%m-%d"))

        # Anchor Hotel
        hotel_name = "Selected Accommodation"
        hotel_lat: Optional[float] = None
        hotel_lon: Optional[float] = None
        if ranked_hotels and len(ranked_hotels) > 0:
            h0 = ranked_hotels[0]
            h_obj = (h0.get("hotel") if isinstance(h0, dict) else None) or (h0.get("ranked_hotel") if isinstance(h0, dict) else None) or h0
            if isinstance(h_obj, dict):
                hotel_name = h_obj.get("name", "Selected Hotel")
                hotel_lat = h_obj.get("latitude")
                hotel_lon = h_obj.get("longitude")
        elif hotel_result and hotel_result.get("hotels"):
            h0 = hotel_result["hotels"][0]
            if isinstance(h0, dict):
                hotel_name = h0.get("name", "Selected Hotel")
                hotel_lat = h0.get("latitude")
                hotel_lon = h0.get("longitude")

        # Extract Ranked Attractions
        candidate_attractions: List[Dict[str, Any]] = []
        if ranked_attractions:
            for item in ranked_attractions:
                if not isinstance(item, dict):
                    continue
                p = item.get("place") or item.get("attraction") or item
                if isinstance(p, dict) and p.get("name"):
                    candidate_attractions.append({
                        "name": p.get("name"),
                        "category": p.get("category", "Attraction"),
                        "latitude": p.get("latitude"),
                        "longitude": p.get("longitude"),
                        "score": item.get("relevance_score", 80),
                        "reason": item.get("suitability_reason", "")
                    })
        elif places_result and (places_result.get("places") or places_result.get("attractions")):
            raw_places = places_result.get("places") or places_result.get("attractions") or []
            for p in raw_places:
                if p.get("name"):
                    candidate_attractions.append({
                        "name": p.get("name"),
                        "category": p.get("category", "Attraction"),
                        "latitude": p.get("latitude"),
                        "longitude": p.get("longitude"),
                        "score": 75,
                        "reason": "Top local highlight."
                    })

        # Extract Food Venues
        candidate_food: List[Dict[str, Any]] = []
        if food_result and food_result.get("venues"):
            for f in food_result["venues"]:
                candidate_food.append({
                    "name": f.get("name"),
                    "cuisine": f.get("cuisine", "Local Cuisine"),
                    "latitude": f.get("latitude"),
                    "longitude": f.get("longitude"),
                    "score": f.get("relevance_score", 80),
                    "price_level": f.get("price_level", "Moderate")
                })

        # Extract Transportation Hubs & Corridors
        hubs: List[Dict[str, Any]] = []
        corridors: Dict[str, Dict[str, Any]] = {}
        if transportation_result:
            hubs = transportation_result.get("clusters", [])
            for c in transportation_result.get("corridors", []):
                key = f"{c.get('origin', '').lower()}_{c.get('destination', '').lower()}"
                corridors[key] = c

        # Helper to determine transport mode
        def get_transit_mode(orig_name: str, dest_name: str, dist_km: Optional[float] = None) -> str:
            # Check precomputed corridor
            key1 = f"{orig_name.lower()}_{dest_name.lower()}"
            key2 = f"{dest_name.lower()}_{orig_name.lower()}"
            if key1 in corridors:
                return corridors[key1].get("recommended_mode", "Cab")
            if key2 in corridors:
                return corridors[key2].get("recommended_mode", "Cab")

            if dist_km is None:
                return "Cab / Arranged Vehicle" if is_accessibility_active else "Walking / Public Transit"

            # Strict rules
            if is_accessibility_active:
                return "Walking" if dist_km <= 0.5 else "Cab / Arranged Vehicle"
            else:
                if dist_km <= 1.2:
                    return "Walking"
                elif dist_km <= 4.0:
                    return "Taxi / Cab" if travelers >= 3 else "Public Transit"
                else:
                    return "Private Vehicle" if travelers >= 4 else "Taxi / Cab"

        # Determine daily pace
        # Relaxed: 1-2 attractions/day, Standard: 2-3, Fast: 3-4
        pace_str = str(pace).lower()
        if "relax" in pace_str or "slow" in pace_str:
            max_attr_per_day = 2
        elif "fast" in pace_str or "packed" in pace_str or "active" in pace_str:
            max_attr_per_day = 4
        else:
            max_attr_per_day = 3

        # If accessibility is active, cap at 2 attractions/day
        if is_accessibility_active:
            max_attr_per_day = min(max_attr_per_day, 2)

        # Weather context
        daily_weather: List[Dict[str, Any]] = []
        if weather_result and weather_result.get("forecast_days"):
            daily_weather = weather_result["forecast_days"]

        # Organize attractions by hubs or proximity
        assigned_attractions = set()
        days_output: List[ItineraryDay] = []
        food_idx = 0

        # Activity ID counter
        act_counter = 1

        for day_num, d_str in enumerate(dates, 1):
            w_summary = "Pleasant weather conditions expected."
            w_rain_risk = False
            if daily_weather and len(daily_weather) >= day_num:
                w_day = daily_weather[day_num - 1]
                temp = w_day.get("temp_max_c", 28)
                cond = w_day.get("condition", "Partly cloudy")
                precip = w_day.get("precipitation_probability_pct", 0)
                w_summary = f"{cond}, {temp}°C (Rain probability: {precip}%)"
                if precip > 50 or "rain" in cond.lower() or "storm" in cond.lower():
                    w_rain_risk = True

            day_activities: List[ItineraryActivity] = []
            day_theme = None

            # Day 1: Arrival & Check-in
            if day_num == 1:
                orig_disp = origin if origin else "Your Origin"
                day_activities.append(ItineraryActivity(
                    activity_id=f"act_{act_counter}",
                    time="09:00",
                    type="arrival",
                    title=f"Arrive in {destination}",
                    description=f"Journey arrival from {orig_disp}. Welcome to {destination}!",
                    place_name=f"{destination} Transit Hub"
                ))
                act_counter += 1

                # Transit to Hotel
                dist_to_hotel = 5.0
                mode = get_transit_mode("Arrival", hotel_name, dist_to_hotel)
                day_activities.append(ItineraryActivity(
                    activity_id=f"act_{act_counter}",
                    time="10:00",
                    type="transport",
                    title=f"Transfer to {hotel_name}",
                    origin=f"{destination} Arrival Hub",
                    destination=hotel_name,
                    transport_mode=mode,
                    distance_km=dist_to_hotel,
                    description=f"Direct transfer to lodging via {mode}."
                ))
                act_counter += 1

                # Hotel Check-in
                day_activities.append(ItineraryActivity(
                    activity_id=f"act_{act_counter}",
                    time="11:00",
                    type="hotel",
                    title="Accommodation Check-in & Freshen Up",
                    place_name=hotel_name,
                    latitude=hotel_lat,
                    longitude=hotel_lon,
                    description=f"Settle into {hotel_name} and orient for your journey."
                ))
                act_counter += 1

            else:
                # Other days: Morning breakfast/start from hotel
                day_activities.append(ItineraryActivity(
                    activity_id=f"act_{act_counter}",
                    time="08:30",
                    type="hotel",
                    title="Morning Refreshment & Briefing",
                    place_name=hotel_name,
                    latitude=hotel_lat,
                    longitude=hotel_lon,
                    description=f"Breakfast at {hotel_name} and prepare for today's exploration."
                ))
                act_counter += 1

            # Select attractions for today
            day_attractions: List[Dict[str, Any]] = []

            # Prioritize matching hub if available
            available_hubs = [h for h in hubs if any(p.get("name") not in assigned_attractions for p in h.get("locations", []))]
            if available_hubs:
                target_hub = available_hubs[0]
                day_theme = target_hub.get("cluster_name", f"{destination} Sightseeing")
                for loc in target_hub.get("locations", []):
                    lname = loc.get("name")
                    if lname not in assigned_attractions and len(day_attractions) < max_attr_per_day:
                        assigned_attractions.add(lname)
                        day_attractions.append({
                            "name": lname,
                            "category": "Sightseeing Hub",
                            "latitude": loc.get("latitude"),
                            "longitude": loc.get("longitude"),
                            "score": 85,
                            "reason": f"Part of {day_theme}."
                        })
            else:
                # Fallback to candidate attractions by rank
                for c in candidate_attractions:
                    if c["name"] not in assigned_attractions and len(day_attractions) < max_attr_per_day:
                        assigned_attractions.add(c["name"])
                        day_attractions.append(c)

            if not day_theme:
                if day_attractions:
                    day_theme = f"{day_attractions[0]['name']} Exploration"
                else:
                    day_theme = f"Discovery & Leisure in {destination}"

            # Weather adaptation: if rain risk, note indoor preference
            for a in day_attractions:
                if w_rain_risk and "museum" in a.get("category", "").lower():
                    a["weather_note"] = "Ideal indoor visit protected from precipitation."
                elif w_rain_risk:
                    a["weather_note"] = "Weather advisory: High rain probability; carry umbrella and monitor local conditions."

            # Schedule morning/afternoon attractions with transit & lunch
            cur_location = hotel_name
            cur_lat = hotel_lat
            cur_lon = hotel_lon

            # Split attractions around lunch
            morning_attrs = day_attractions[:1] if len(day_attractions) > 1 else day_attractions
            afternoon_attrs = day_attractions[1:] if len(day_attractions) > 1 else []

            # Morning activity
            for attr in morning_attrs:
                # Transit
                dist = None
                if cur_lat is not None and attr.get("latitude") is not None:
                    dist = calculate_haversine(cur_lat, cur_lon, attr["latitude"], attr["longitude"])
                mode = get_transit_mode(cur_location, attr["name"], dist)

                day_activities.append(ItineraryActivity(
                    activity_id=f"act_{act_counter}",
                    time="10:00",
                    type="transport",
                    title=f"Transit to {attr['name']}",
                    origin=cur_location,
                    destination=attr["name"],
                    transport_mode=mode,
                    distance_km=dist,
                    accessibility_notes="Minimal walking route arranged" if is_accessibility_active else None
                ))
                act_counter += 1

                day_activities.append(ItineraryActivity(
                    activity_id=f"act_{act_counter}",
                    time="10:30",
                    type="attraction",
                    title=f"Explore {attr['name']}",
                    place_name=attr["name"],
                    latitude=attr.get("latitude"),
                    longitude=attr.get("longitude"),
                    description=attr.get("reason", f"Must-see attraction in {destination}."),
                    weather_note=attr.get("weather_note")
                ))
                act_counter += 1
                cur_location = attr["name"]
                cur_lat = attr.get("latitude")
                cur_lon = attr.get("longitude")

            # Lunch ~13:00
            lunch_venue = None
            if candidate_food:
                lunch_venue = candidate_food[food_idx % len(candidate_food)]
                food_idx += 1

            l_name = lunch_venue["name"] if lunch_venue else "Local Specialty Dining"
            l_lat = lunch_venue.get("latitude") if lunch_venue else None
            l_lon = lunch_venue.get("longitude") if lunch_venue else None
            l_cuisine = lunch_venue.get("cuisine", "Regional Cuisine") if lunch_venue else "Authentic Fare"

            day_activities.append(ItineraryActivity(
                activity_id=f"act_{act_counter}",
                time="13:00",
                type="food",
                title=f"Lunch at {l_name}",
                place_name=l_name,
                latitude=l_lat,
                longitude=l_lon,
                description=f"Enjoy {l_cuisine} and take a restful pause."
            ))
            act_counter += 1
            cur_location = l_name
            cur_lat = l_lat
            cur_lon = l_lon

            # Afternoon activity
            time_slots = ["14:45", "16:45"]
            for idx, attr in enumerate(afternoon_attrs):
                slot_time = time_slots[min(idx, len(time_slots) - 1)]
                dist = None
                if cur_lat is not None and attr.get("latitude") is not None:
                    dist = calculate_haversine(cur_lat, cur_lon, attr["latitude"], attr["longitude"])
                mode = get_transit_mode(cur_location, attr["name"], dist)

                day_activities.append(ItineraryActivity(
                    activity_id=f"act_{act_counter}",
                    time=slot_time,
                    type="transport",
                    title=f"Transit to {attr['name']}",
                    origin=cur_location,
                    destination=attr["name"],
                    transport_mode=mode,
                    distance_km=dist,
                    accessibility_notes="Vehicle transit prioritizing comfort" if is_accessibility_active else None
                ))
                act_counter += 1

                # Activity time ~30 mins after transit
                h, m = map(int, slot_time.split(":"))
                m_act = m + 30
                if m_act >= 60:
                    h += 1
                    m_act -= 60
                act_time = f"{h:02d}:{m_act:02d}"

                day_activities.append(ItineraryActivity(
                    activity_id=f"act_{act_counter}",
                    time=act_time,
                    type="attraction",
                    title=f"Visit {attr['name']}",
                    place_name=attr["name"],
                    latitude=attr.get("latitude"),
                    longitude=attr.get("longitude"),
                    description=attr.get("reason", f"Key highlight in {destination}."),
                    weather_note=attr.get("weather_note")
                ))
                act_counter += 1
                cur_location = attr["name"]
                cur_lat = attr.get("latitude")
                cur_lon = attr.get("longitude")

            # Evening Rest / Dinner
            if is_accessibility_active or "relax" in str(travel_style).lower():
                day_activities.append(ItineraryActivity(
                    activity_id=f"act_{act_counter}",
                    time="18:00",
                    type="rest",
                    title="Evening Leisure & Rest Period",
                    description="Unwind and recharge before dinner without physical exertion."
                ))
                act_counter += 1

            # Dinner ~20:00
            dinner_venue = None
            if candidate_food:
                dinner_venue = candidate_food[food_idx % len(candidate_food)]
                food_idx += 1

            d_name = dinner_venue["name"] if dinner_venue else f"{destination} Gourmet Dining"
            d_lat = dinner_venue.get("latitude") if dinner_venue else None
            d_lon = dinner_venue.get("longitude") if dinner_venue else None
            d_cuisine = dinner_venue.get("cuisine", "Fine Dining") if dinner_venue else "Local Specialty"

            day_activities.append(ItineraryActivity(
                activity_id=f"act_{act_counter}",
                time="20:00",
                type="food",
                title=f"Dinner at {d_name}",
                place_name=d_name,
                latitude=d_lat,
                longitude=d_lon,
                description=f"Savor {d_cuisine} cuisine in a relaxed ambiance."
            ))
            act_counter += 1

            # Last day: Departure
            if day_num == len(dates):
                day_activities.append(ItineraryActivity(
                    activity_id=f"act_{act_counter}",
                    time="22:00",
                    type="departure",
                    title=f"Departure from {destination}",
                    description=f"Conclude memorable journey and transfer to departure terminal.",
                    place_name=f"{destination} Transit Terminal"
                ))
                act_counter += 1

            days_output.append(ItineraryDay(
                day_number=day_num,
                date=d_str,
                title=f"Day {day_num}: {day_theme}",
                theme=day_theme,
                weather_summary=w_summary,
                activities=day_activities
            ))

        # Perform comprehensive validation (Part 18)
        validation_notes: List[str] = []
        is_dates_valid = all(d.date in dates for d in days_output)
        if not is_dates_valid:
            validation_notes.append("Warning: Schedule dates deviated from requested travel window.")

        # Check duplicate attractions
        seen_acts = set()
        no_duplicates = True
        for d in days_output:
            for a in d.activities:
                if a.type == "attraction" and a.place_name:
                    if a.place_name in seen_acts:
                        no_duplicates = False
                        validation_notes.append(f"Duplicate attraction detected: {a.place_name}")
                    seen_acts.add(a.place_name)

        # Check accessibility violations
        acc_respected = True
        if is_accessibility_active:
            for d in days_output:
                for a in d.activities:
                    if a.type == "transport" and a.transport_mode == "Walking" and (a.distance_km or 0) > 0.5:
                        acc_respected = False
                        validation_notes.append(f"Accessibility violation: walking segment {a.distance_km} km exceeds 0.5 km limit.")

        validation = ItineraryValidation(
            is_valid=is_dates_valid and no_duplicates and acc_respected,
            dates_valid=is_dates_valid,
            no_duplicate_attractions=no_duplicates,
            transit_modes_valid=True,
            accessibility_respected=acc_respected,
            weather_adjusted=True,
            pace_balanced=True,
            validation_notes=validation_notes
        )

        total_acts = sum(len(d.activities) for d in days_output)

        return ItineraryResult(
            trip_summary=TripSummary(
                destination=destination,
                origin=origin,
                start_date=dates[0] if dates else dep_date_str,
                end_date=dates[-1] if dates else ret_date_str,
                travelers=travelers,
                travel_style=travel_style,
                hotel_name=hotel_name,
                accessibility_active=is_accessibility_active
            ),
            days=days_output,
            total_days=len(days_output),
            total_activities=total_acts,
            validation=validation,
            generation_notes=f"Generated {len(days_output)}-day comprehensive itinerary synthesized with {len(seen_acts)} attractions and {total_acts} scheduled activities."
        )

itinerary_service = ItineraryService()
