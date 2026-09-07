from typing import TypedDict, List, Optional, Dict, Any
from app.schemas.travel_plan import TravelPlanningTask, TravelPlanningResult

class AgentState(TypedDict):
    enhanced_trip_profile: Dict[str, Any]
    planning_tasks: List[Dict[str, Any]]
    current_task: Optional[Dict[str, Any]]
    completed_tasks: List[Dict[str, Any]]
    weather_result: Optional[Dict[str, Any]]
    weather_insight: Optional[Dict[str, Any]]
    places_result: Optional[Dict[str, Any]]
    ranked_attractions: Optional[List[Dict[str, Any]]]
    agent_messages: List[str]
    planning_status: str
    planning_result: Optional[Dict[str, Any]]
    errors: List[str]
