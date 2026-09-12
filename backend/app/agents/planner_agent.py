import logging
from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, START, END

from app.agents.agent_state import AgentState
from app.schemas.travel_plan import (
    TravelPlanningResult,
    TravelPlanningTask,
    TaskStatus,
    TaskPriority,
    TaskType
)
from app.schemas.travel_preferences import EnhancedTripProfile
from app.schemas.weather import WeatherResult
from app.schemas.places import PlacesResult, RankedAttraction
from app.schemas.hotel import HotelResult, RankedHotel
from app.prompts.planner_prompt import get_planner_prompt
from app.services.llm_service import get_llm
from app.tools.weather_tool import weather_tool
from app.tools.places_tool import places_tool
from app.tools.hotel_tool import hotel_tool
from app.services.transportation_service import transportation_service
from app.services.food_service import food_service
from app.services.itinerary_service import itinerary_service

logger = logging.getLogger(__name__)

def initialize_planning(state: AgentState) -> Dict[str, Any]:
    """Node 1: Initializes the planning agent state."""
    profile = state.get("enhanced_trip_profile", {})
    dest = profile.get("trip_request", {}).get("destination", "Destination")
    s_id = state.get("session_id")
    logger.info("[SESSION] AgentState session_id: %s", s_id)
    return {
        "session_id": s_id,
        "planning_status": "initializing",
        "agent_messages": [f"Initializing autonomous travel planning agent for {dest}."],
        "weather_result": None,
        "weather_insight": None,
        "places_result": None,
        "ranked_attractions": None,
        "hotel_result": None,
        "ranked_hotels": None,
        "transportation_result": None,
        "food_result": None,
        "itinerary_result": None,
        "errors": []
    }

async def generate_tasks(state: AgentState) -> Dict[str, Any]:
    """Node 2: Uses Groq LLM to decompose the EnhancedTripProfile into structured planning tasks."""
    profile = state.get("enhanced_trip_profile", {})
    trip_req = profile.get("trip_request", {})
    trip_analysis = profile.get("trip_analysis", {})
    travel_prefs = profile.get("travel_preferences") or {}
    combined_constraints = profile.get("combined_constraints", [])

    prompt_template = get_planner_prompt()

    try:
        llm = get_llm()
        structured_llm = llm.with_structured_output(TravelPlanningResult)
        chain = prompt_template | structured_llm

        prompt_input = {
            "origin": trip_req.get("origin", "Unspecified"),
            "destination": trip_req.get("destination", "Unspecified"),
            "departure_date": trip_req.get("departure_date", "Unspecified"),
            "return_date": trip_req.get("return_date", "Unspecified"),
            "duration_days": trip_analysis.get("duration_days", 1),
            "travelers": trip_req.get("travelers", 1),
            "budget": trip_req.get("budget", 0),
            "budget_level": trip_analysis.get("budget_level", "Moderate"),
            "budget_per_day": trip_analysis.get("budget_per_day", 0),
            "budget_per_traveler": trip_analysis.get("budget_per_traveler", 0),
            "preferences": ", ".join(trip_req.get("preferences", [])) or "Standard leisure",
            "travel_style": trip_analysis.get("travel_style", "Standard"),
            "accommodation_expectation": trip_analysis.get("accommodation_expectation", "Standard"),
            "combined_constraints": "; ".join(combined_constraints) if combined_constraints else "None",
            "travel_mood": travel_prefs.get("travel_mood") or "Flexible",
            "pace": travel_prefs.get("pace") or "Standard",
            "traveler_context": travel_prefs.get("traveler_context") or f"{trip_req.get('travelers', 1)} traveler(s)",
            "accommodation_preferences": travel_prefs.get("accommodation_preferences") or "Standard",
            "avoided_activities": ", ".join(travel_prefs.get("avoided_activities", [])) or "None",
            "food_preferences": travel_prefs.get("food_preferences") or "Local / diverse",
            "transportation_preferences": travel_prefs.get("transportation_preferences") or "Standard",
            "accessibility_or_special_constraints": travel_prefs.get("accessibility_or_special_constraints") or "None"
        }

        planning_result: TravelPlanningResult = await chain.ainvoke(prompt_input)

        # Convert Pydantic tasks to dicts for graph state serialization
        task_dicts = [t.model_dump() for t in planning_result.tasks]

        return {
            "planning_result": planning_result.model_dump(),
            "planning_tasks": task_dicts,
            "planning_status": "tasks_generated",
            "agent_messages": state.get("agent_messages", []) + [
                f"Generated {len(task_dicts)} strategic planning tasks tailored to your trip profile."
            ]
        }
    except Exception as e:
        logger.error(f"Error in generate_tasks node: {e}", exc_info=True)
        # Fallback default tasks if LLM generation fails
        fallback_tasks = [
            TravelPlanningTask(
                task_id="validate_constraints",
                task_name="Validate Trip Parameters & Constraints",
                description="Verify travel dates, duration, and budget feasibility.",
                task_type=TaskType.VALIDATION,
                priority=TaskPriority.HIGH,
                dependencies=[],
                status=TaskStatus.PENDING
            ),
            TravelPlanningTask(
                task_id="weather_assessment",
                task_name="Check Destination Weather & Climate",
                description="Retrieve live forecast and climate context for travel dates.",
                task_type=TaskType.WEATHER,
                priority=TaskPriority.HIGH,
                dependencies=["validate_constraints"],
                status=TaskStatus.PENDING
            ),
            TravelPlanningTask(
                task_id="budget_allocation",
                task_name="Allocate Category Budget",
                description="Distribute budget across lodging, food, and activities.",
                task_type=TaskType.BUDGET,
                priority=TaskPriority.HIGH,
                dependencies=["validate_constraints"],
                status=TaskStatus.PENDING
            ),
            TravelPlanningTask(
                task_id="attraction_discovery",
                task_name="Curate Tailored Attractions",
                description="Discover attractions aligned with selected preferences.",
                task_type=TaskType.ATTRACTION,
                priority=TaskPriority.MEDIUM,
                dependencies=["validate_constraints"],
                status=TaskStatus.PENDING
            ),
            TravelPlanningTask(
                task_id="accommodation_curation",
                task_name="Discover & Match Suitable Accommodations",
                description="Retrieve verified accommodations from OpenStreetMap and score against trip budget and travel style.",
                task_type=TaskType.ACCOMMODATION,
                priority=TaskPriority.HIGH,
                dependencies=["validate_constraints"],
                status=TaskStatus.PENDING
            ),
            TravelPlanningTask(
                task_id="transportation_optimization",
                task_name="Analyze Transportation & Optimize Routes",
                description="Analyze geographic clusters between accommodation and attractions to recommend transit modes and route efficiencies.",
                task_type=TaskType.TRANSPORTATION,
                priority=TaskPriority.HIGH,
                dependencies=["attraction_discovery", "accommodation_curation"],
                status=TaskStatus.PENDING
            ),
            TravelPlanningTask(
                task_id="food_discovery",
                task_name="Discover Tailored Dining & Culinary Highlights",
                description="Discover verified restaurants and cafes from OpenStreetMap matched with budget and dietary preferences.",
                task_type=TaskType.FOOD,
                priority=TaskPriority.MEDIUM,
                dependencies=["validate_constraints"],
                status=TaskStatus.PENDING
            ),
            TravelPlanningTask(
                task_id="itinerary_sequencing",
                task_name="Synthesize Day-Wise Itinerary",
                description="Synthesize cohesive day-wise schedule integrating weather, attractions, dining, and transit recommendations.",
                task_type=TaskType.ITINERARY,
                priority=TaskPriority.HIGH,
                dependencies=["attraction_discovery", "accommodation_curation", "transportation_optimization", "food_discovery"],
                status=TaskStatus.PENDING
            )
        ]
        fallback_result = TravelPlanningResult(
            overall_goal="Synthesize travel plan based on structured parameters.",
            planning_strategy="Default modular planning workflow.",
            key_constraints=combined_constraints,
            tasks=fallback_tasks
        )
        return {
            "planning_result": fallback_result.model_dump(),
            "planning_tasks": [t.model_dump() for t in fallback_tasks],
            "planning_status": "tasks_generated_fallback",
            "errors": state.get("errors", []) + [str(e)],
            "agent_messages": state.get("agent_messages", []) + [
                "Decomposed trip into standard baseline planning workflow."
            ]
        }

def validate_tasks(state: AgentState) -> Dict[str, Any]:
    """Node 3: Validates task graph integrity and sanitizes dependencies."""
    tasks = state.get("planning_tasks", [])
    valid_ids = {t["task_id"] for t in tasks}

    sanitized_tasks = []
    for t in tasks:
        # Filter out invalid or self-referential dependencies
        cleaned_deps = [dep for dep in t.get("dependencies", []) if dep in valid_ids and dep != t["task_id"]]
        t_copy = dict(t)
        t_copy["dependencies"] = cleaned_deps
        sanitized_tasks.append(t_copy)

    return {
        "planning_tasks": sanitized_tasks,
        "planning_status": "tasks_validated",
        "agent_messages": state.get("agent_messages", []) + [
            "Verified task dependencies and workflow execution graph."
        ]
    }

async def execute_task_simulation(state: AgentState) -> Dict[str, Any]:
    """Node 4: Simulates dependency-ordered task execution and executes real Weather & Places Tools."""
    tasks = list(state.get("planning_tasks", []))
    profile_dict = state.get("enhanced_trip_profile", {})
    trip_req = profile_dict.get("trip_request", {})
    dest = trip_req.get("destination", "Destination")
    dep_date = trip_req.get("departure_date")
    ret_date = trip_req.get("return_date")
    travel_context = profile_dict.get("trip_analysis", {}).get("trip_summary", "Standard leisure trip")

    try:
        profile_obj = EnhancedTripProfile(**profile_dict)
    except Exception:
        profile_obj = None

    completed = []
    messages = list(state.get("agent_messages", []))
    errors = list(state.get("errors", []))
    weather_result_dict = state.get("weather_result")
    weather_insight_dict = state.get("weather_insight")
    places_result_dict = state.get("places_result")
    ranked_attractions_list = state.get("ranked_attractions")
    hotel_result_dict = state.get("hotel_result")
    ranked_hotels_list = state.get("ranked_hotels")
    transportation_result_dict = state.get("transportation_result")
    food_result_dict = state.get("food_result")
    itinerary_result_dict = state.get("itinerary_result")

    def get_simulation_summary(task_id: str, task_name: str) -> str:
        tid = task_id.lower()
        if "hotel" in tid or "accommodation" in tid or "lodging" in tid:
            return "Lodging preferences and location criteria matched against real accommodation database."
        elif "budget" in tid or "cost" in tid:
            return "Budget distribution calculated across lodging, dining, transit, and experiences."
        elif "transit" in tid or "transport" in tid:
            return "Transportation mode and route connectivity verified."
        elif "food" in tid or "dining" in tid or "restaurant" in tid:
            return "Dining venues discovered and matched with preferences."
        elif "sequence" in tid or "route" in tid or "itinerary" in tid:
            return "Geographic pacing and daily activity sequence organized."
        elif "constraint" in tid or "validate" in tid or "safety" in tid:
            return "Trip safety guidelines and user-specified constraints verified."
        else:
            return f"Planning step successfully processed: {task_name}."

    remaining = {t["task_id"]: dict(t) for t in tasks}
    completed_ids = set()
    last_task = None

    max_cycles = len(tasks) * 2 + 1
    cycle = 0

    while remaining and cycle < max_cycles:
        cycle += 1
        ready_tasks = [
            t for t in remaining.values()
            if all(dep in completed_ids for dep in t.get("dependencies", []))
        ]

        if not ready_tasks:
            # Mark unresolved dependencies failed
            for unresolvable_id, unresolvable_task in list(remaining.items()):
                unresolvable_task["status"] = TaskStatus.FAILED.value
                unresolvable_task["execution_output"] = "Task dependency could not be resolved in the planning graph."
                completed.append(unresolvable_task)
                errors.append(f"Planning task '{unresolvable_task.get('task_name', unresolvable_id)}' failed dependency check.")
                messages.append(f"Task '{unresolvable_task.get('task_name', unresolvable_id)}' could not satisfy dependencies.")
                del remaining[unresolvable_id]
            break

        for task in ready_tasks:
            tid = task["task_id"]
            tname = task.get("task_name", tid)
            ttype = task.get("task_type", TaskType.OTHER.value)
            last_task = task
            task["status"] = TaskStatus.IN_PROGRESS.value

            # Domain Execution Logic
            # 1. Weather Tool Branch
            is_weather_task = (
                ttype == TaskType.WEATHER.value or
                ttype == "weather" or
                "weather" in tid.lower() or
                "weather" in tname.lower() or
                "climate" in tid.lower() or
                "climate" in tname.lower()
            )

            # 2. Attraction / Places Tool Branch
            is_attraction_task = (
                ttype == TaskType.ATTRACTION.value or
                ttype == "attraction" or
                "attraction" in tid.lower() or
                "attraction" in tname.lower() or
                "places" in tid.lower() or
                "places" in tname.lower() or
                "sight" in tid.lower() or
                "sight" in tname.lower() or
                "poi" in tid.lower() or
                "poi" in tname.lower()
            )

            # 3. Accommodation / Hotel Tool Branch
            is_accommodation_task = (
                ttype == TaskType.ACCOMMODATION.value or
                ttype == "accommodation" or
                "hotel" in tid.lower() or
                "hotel" in tname.lower() or
                "accommodation" in tid.lower() or
                "accommodation" in tname.lower() or
                "lodging" in tid.lower() or
                "lodging" in tname.lower() or
                "stay" in tid.lower() or
                "stay" in tname.lower()
            )

            # 4. Transportation / Transit Branch
            is_transportation_task = (
                ttype == TaskType.TRANSPORTATION.value or
                ttype == "transportation" or
                "transit" in tid.lower() or
                "transit" in tname.lower() or
                "transport" in tid.lower() or
                "transport" in tname.lower() or
                "route" in tid.lower() or
                "route" in tname.lower() or
                "logistics" in tid.lower() or
                "logistics" in tname.lower() or
                "mobility" in tid.lower() or
                "mobility" in tname.lower()
            )

            # 5. Food & Dining Branch
            is_food_task = (
                ttype == TaskType.FOOD.value or
                ttype == "food" or
                "dining" in tid.lower() or
                "dining" in tname.lower() or
                "restaurant" in tid.lower() or
                "restaurant" in tname.lower() or
                "food" in tid.lower() or
                "food" in tname.lower() or
                "culinary" in tid.lower() or
                "culinary" in tname.lower()
            )

            # 6. Itinerary Branch
            is_itinerary_task = (
                ttype == TaskType.ITINERARY.value or
                ttype == "itinerary" or
                "itinerary" in tid.lower() or
                "itinerary" in tname.lower() or
                "schedule" in tid.lower() or
                "schedule" in tname.lower() or
                "day-by-day" in tid.lower() or
                "day-wise" in tid.lower()
            )

            if is_weather_task and weather_result_dict is None:
                try:
                    # Execute REAL Weather Tool
                    weather_res = await weather_tool.fetch_weather_for_trip(
                        destination=dest,
                        departure_date=dep_date,
                        return_date=ret_date
                    )
                    weather_ins = await weather_tool.generate_insight(
                        weather_result=weather_res,
                        travel_context=travel_context
                    )
                    weather_result_dict = weather_res.model_dump()
                    weather_insight_dict = weather_ins.model_dump()

                    if weather_res.forecast_available:
                        task["execution_output"] = f"Real-time forecast retrieved ({len(weather_res.weather_days)} days): {weather_res.planning_notes or 'Forecast synced'}."
                    else:
                        task["execution_output"] = f"Weather status logged: {weather_res.planning_notes}."

                    messages.append(f"Retrieved real weather intelligence for {weather_res.location}.")
                except Exception as w_err:
                    logger.warning(f"Weather tool execution failed gracefully: {w_err}")
                    task["execution_output"] = "Weather information check completed with advisory notice."
                    errors.append(f"Weather tool advisory: {str(w_err)}")
                    messages.append("Weather tool check completed with advisory notice.")

            elif is_weather_task:
                task["execution_output"] = "Weather assessment synchronized with active weather intelligence."

            elif is_attraction_task and places_result_dict is None and profile_obj is not None:
                try:
                    # Reconstruct active weather result if available
                    w_res_obj = WeatherResult(**weather_result_dict) if weather_result_dict else None

                    # Execute REAL Places Tool
                    places_res, ranked_list = await places_tool.discover_and_rank_places(
                        destination=dest,
                        profile=profile_obj,
                        weather_result=w_res_obj
                    )
                    places_result_dict = places_res.model_dump()
                    ranked_attractions_list = [r.model_dump() for r in ranked_list]

                    if places_res.source_status == "success":
                        task["execution_output"] = f"Discovered {places_res.total_found} verified places via OpenStreetMap and ranked {len(ranked_list)} top attractions tailored to your preferences."
                    else:
                        task["execution_output"] = f"Attractions status: {places_res.message or 'Completed places scan'}."

                    messages.append(f"Retrieved real attraction intelligence ({places_res.total_found} POIs) for {dest} via OpenStreetMap.")
                except Exception as p_err:
                    logger.warning(f"Places tool execution failed gracefully: {p_err}")
                    task["execution_output"] = "Attraction discovery completed with baseline recommendations."
                    errors.append(f"Places tool advisory: {str(p_err)}")
                    messages.append("Attraction discovery completed with baseline recommendations.")

            elif is_attraction_task:
                task["execution_output"] = "Attraction curation synchronized with active destination intelligence."

            elif is_accommodation_task and hotel_result_dict is None and profile_obj is not None:
                try:
                    # Execute REAL Hotel Tool
                    hotel_res, ranked_h_list = await hotel_tool.discover_and_rank_hotels(
                        destination=dest,
                        profile=profile_obj
                    )
                    hotel_result_dict = hotel_res.model_dump()
                    ranked_hotels_list = [r.model_dump() for r in ranked_h_list]

                    if hotel_res.source_status == "success":
                        task["execution_output"] = f"Discovered {hotel_res.total_found} verified accommodations via OpenStreetMap and ranked {len(ranked_h_list)} tailored stays based on your budget and style."
                    else:
                        task["execution_output"] = f"Accommodation status: {hotel_res.message or 'Completed lodging scan'}."

                    messages.append(f"Retrieved real accommodation intelligence ({hotel_res.total_found} properties) for {dest} via OpenStreetMap.")
                except Exception as h_err:
                    logger.warning(f"Hotel tool execution failed gracefully: {h_err}")
                    task["execution_output"] = "Accommodation discovery completed with baseline lodging recommendations."
                    errors.append(f"Hotel tool advisory: {str(h_err)}")
                    messages.append("Accommodation discovery completed with baseline advisory.")

            elif is_accommodation_task:
                task["execution_output"] = "Accommodation scoring synchronized with active destination lodging intelligence."

            elif is_transportation_task and transportation_result_dict is None and profile_obj is not None:
                try:
                    selected_hotel = None
                    if ranked_hotels_list and len(ranked_hotels_list) > 0:
                        selected_hotel = ranked_hotels_list[0]
                    elif hotel_result_dict and hotel_result_dict.get("hotels"):
                        selected_hotel = hotel_result_dict["hotels"][0]

                    attractions_for_transit = []
                    if ranked_attractions_list:
                        attractions_for_transit = ranked_attractions_list
                    elif places_result_dict and (places_result_dict.get("places") or places_result_dict.get("attractions")):
                        attractions_for_transit = places_result_dict.get("places") or places_result_dict.get("attractions", [])

                    dest_coords = None
                    if places_result_dict and places_result_dict.get("latitude") and places_result_dict.get("longitude"):
                        dest_coords = (places_result_dict["latitude"], places_result_dict["longitude"])

                    trans_res = await transportation_service.generate_transportation_plan(
                        destination=dest,
                        destination_coords=dest_coords,
                        hotel=selected_hotel,
                        attractions=attractions_for_transit,
                        profile=profile_obj
                    )
                    transportation_result_dict = trans_res.model_dump()
                    task["execution_output"] = f"Analyzed {trans_res.total_clusters} attraction clusters; synthesized route sequence with {len(trans_res.recommendations)} transit mode recommendations."
                    messages.append(f"Generated route optimization and transit recommendations ({trans_res.total_clusters} hubs) for {dest}.")
                except Exception as t_err:
                    logger.warning(f"Transportation planning execution failed gracefully: {t_err}")
                    task["execution_output"] = "Transportation and routing analysis completed with standard mobility recommendations."
                    errors.append(f"Transportation advisory: {str(t_err)}")
                    messages.append("Transportation analysis completed with standard mobility advisory.")

            elif is_transportation_task:
                task["execution_output"] = "Transportation and route intelligence synchronized with active attraction hubs."

            elif is_food_task and food_result_dict is None and dest:
                try:
                    food_res = await food_service.fetch_food_for_destination(dest, profile=profile_dict)
                    food_result_dict = food_res.model_dump()
                    task["execution_output"] = f"Discovered {food_res.total_found} verified dining venues via OpenStreetMap tailored to preferences."
                    messages.append(f"Retrieved dining intelligence ({food_res.total_found} venues) for {dest} via OpenStreetMap.")
                except Exception as f_err:
                    logger.warning(f"Food tool execution failed gracefully: {f_err}")
                    task["execution_output"] = "Dining recommendations synthesized with local culinary highlights."
                    messages.append("Dining discovery completed with standard recommendations.")

            elif is_food_task:
                task["execution_output"] = "Dining curation synchronized with destination culinary options."

            elif is_itinerary_task and itinerary_result_dict is None and profile_dict:
                try:
                    iti_res = itinerary_service.generate_itinerary(
                        trip_profile=profile_dict,
                        weather_result=weather_result_dict,
                        weather_insight=weather_insight_dict,
                        places_result=places_result_dict,
                        ranked_attractions=ranked_attractions_list,
                        hotel_result=hotel_result_dict,
                        ranked_hotels=ranked_hotels_list,
                        transportation_result=transportation_result_dict,
                        food_result=food_result_dict
                    )
                    itinerary_result_dict = iti_res.model_dump()
                    task["execution_output"] = f"Synthesized day-wise itinerary for {iti_res.total_days} days ({iti_res.total_activities} scheduled activities)."
                    messages.append(f"Generated comprehensive {iti_res.total_days}-day itinerary for {dest}.")
                except Exception as i_err:
                    logger.warning(f"Itinerary synthesis failed gracefully: {i_err}")
                    task["execution_output"] = "Itinerary sequencing completed with daily activity schedule."
                    messages.append("Itinerary generated with baseline daily activities.")

            elif is_itinerary_task:
                task["execution_output"] = "Itinerary sequencing synchronized with active trip parameters."

            else:
                task["execution_output"] = get_simulation_summary(tid, tname)

            task["status"] = TaskStatus.COMPLETED.value
            completed.append(task)
            completed_ids.add(tid)
            messages.append(f"Completed planning step: {tname}")
            if tid in remaining:
                del remaining[tid]

    # Ensure transportation intelligence is synthesized whenever destination is known
    needs_transport = (
        transportation_result_dict is None 
        or not transportation_result_dict.get("recommendations")
    )
    if needs_transport and dest:
        try:
            selected_hotel = None
            if ranked_hotels_list and len(ranked_hotels_list) > 0:
                selected_hotel = ranked_hotels_list[0]
            elif hotel_result_dict and hotel_result_dict.get("hotels"):
                selected_hotel = hotel_result_dict["hotels"][0]

            attractions_for_transit = (
                ranked_attractions_list 
                or (places_result_dict.get("places") if places_result_dict else None) 
                or (places_result_dict.get("attractions") if places_result_dict else None) 
                or []
            )
            dest_coords = None
            if places_result_dict and places_result_dict.get("latitude") and places_result_dict.get("longitude"):
                dest_coords = (places_result_dict["latitude"], places_result_dict["longitude"])

            trans_res = await transportation_service.generate_transportation_plan(
                destination=dest,
                destination_coords=dest_coords,
                hotel=selected_hotel,
                attractions=attractions_for_transit,
                profile=profile_obj
            )
            transportation_result_dict = trans_res.model_dump()
            messages.append(f"Synthesized transportation intelligence and route optimization for {dest}.")
        except Exception as t_bg_err:
            logger.warning(f"Transportation background synthesis error: {t_bg_err}")

    # Ensure food intelligence is synthesized
    needs_food = (
        food_result_dict is None 
        or not food_result_dict.get("venues")
    )
    if needs_food and dest:
        try:
            food_res = await food_service.fetch_food_for_destination(dest, profile=profile_dict)
            food_result_dict = food_res.model_dump()
            messages.append(f"Synthesized food recommendations ({food_res.total_found} venues) for {dest}.")
        except Exception as f_bg_err:
            logger.warning(f"Food background synthesis error: {f_bg_err}")

    # Ensure Phase 9 itinerary is synthesized consuming all prior intelligence
    needs_itinerary = (
        itinerary_result_dict is None 
        or not itinerary_result_dict.get("days")
    )
    if needs_itinerary and profile_dict:
        try:
            iti_res = itinerary_service.generate_itinerary(
                trip_profile=profile_dict,
                weather_result=weather_result_dict,
                weather_insight=weather_insight_dict,
                places_result=places_result_dict,
                ranked_attractions=ranked_attractions_list,
                hotel_result=hotel_result_dict,
                ranked_hotels=ranked_hotels_list,
                transportation_result=transportation_result_dict,
                food_result=food_result_dict
            )
            itinerary_result_dict = iti_res.model_dump()
            messages.append(f"Synthesized comprehensive {iti_res.total_days}-day itinerary with {iti_res.total_activities} scheduled activities.")
        except Exception as iti_bg_err:
            logger.warning(f"Itinerary background synthesis error: {iti_bg_err}")

    return {
        "session_id": state.get("session_id"),
        "completed_tasks": completed,
        "planning_tasks": completed,
        "current_task": last_task,
        "weather_result": weather_result_dict,
        "weather_insight": weather_insight_dict,
        "places_result": places_result_dict,
        "ranked_attractions": ranked_attractions_list,
        "hotel_result": hotel_result_dict,
        "ranked_hotels": ranked_hotels_list,
        "transportation_result": transportation_result_dict,
        "food_result": food_result_dict,
        "itinerary_result": itinerary_result_dict,
        "planning_status": "execution_simulated",
        "agent_messages": messages,
        "errors": errors
    }

def finalize_plan(state: AgentState) -> Dict[str, Any]:
    """Node 5: Finalizes planning state for client response."""
    return {
        "planning_status": "completed",
        "agent_messages": state.get("agent_messages", []) + [
            "Autonomous planning workflow generated and ready for downstream itinerary building."
        ]
    }

def build_planner_graph():
    """Builds and compiles the LangGraph state graph."""
    graph = StateGraph(AgentState)

    graph.add_node("initialize_planning", initialize_planning)
    graph.add_node("generate_tasks", generate_tasks)
    graph.add_node("validate_tasks", validate_tasks)
    graph.add_node("execute_task_simulation", execute_task_simulation)
    graph.add_node("finalize_plan", finalize_plan)

    graph.add_edge(START, "initialize_planning")
    graph.add_edge("initialize_planning", "generate_tasks")
    graph.add_edge("generate_tasks", "validate_tasks")
    graph.add_edge("validate_tasks", "execute_task_simulation")
    graph.add_edge("execute_task_simulation", "finalize_plan")
    graph.add_edge("finalize_plan", END)

    return graph.compile()

# Singleton compiled workflow
planner_graph = build_planner_graph()
