from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.weather import WeatherResult, WeatherInsight
from app.schemas.places import PlacesResult, RankedAttraction

class TaskPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    FAILED = "failed"

class TaskType(str, Enum):
    WEATHER = "weather"
    ATTRACTION = "attraction"
    ACCOMMODATION = "accommodation"
    TRANSPORTATION = "transportation"
    BUDGET = "budget"
    OPTIMIZATION = "optimization"
    ITINERARY = "itinerary"
    VALIDATION = "validation"
    OTHER = "other"

class TravelPlanningTask(BaseModel):
    task_id: str = Field(
        ..., 
        description="Unique identifier for the planning task (e.g., 'validate_constraints', 'weather_check', 'attraction_discovery', 'budget_allocation')."
    )
    task_name: str = Field(
        ..., 
        description="Human-readable title of the planning step."
    )
    description: str = Field(
        ..., 
        description="Detailed description of what this task accomplishes and why it is needed."
    )
    task_type: TaskType = Field(
        default=TaskType.OTHER,
        description="Domain category for the task: weather, attraction, accommodation, transportation, budget, optimization, itinerary, validation, or other."
    )
    priority: TaskPriority = Field(
        default=TaskPriority.MEDIUM, 
        description="Priority level for executing this task (high, medium, low)."
    )
    dependencies: List[str] = Field(
        default_factory=list, 
        description="List of task_ids that must be completed before this task can execute."
    )
    status: TaskStatus = Field(
        default=TaskStatus.PENDING, 
        description="Current execution status of the task."
    )
    execution_output: Optional[str] = Field(
        default=None, 
        description="Real or simulated execution outcome summary."
    )

class TravelPlanningResult(BaseModel):
    overall_goal: str = Field(
        ..., 
        description="High-level planning objective synthesizing duration, destination, party, and theme."
    )
    planning_strategy: str = Field(
        ..., 
        description="Autonomous strategic approach explaining how the agent prioritized and decomposed tasks."
    )
    key_constraints: List[str] = Field(
        default_factory=list, 
        description="Primary constraints factored into the workflow."
    )
    tasks: List[TravelPlanningTask] = Field(
        default_factory=list, 
        description="List of dynamically decomposed planning tasks."
    )

class ExecutionSummary(BaseModel):
    status: str = Field(
        default="completed", 
        description="Overall execution status of the planning graph."
    )
    completed_tasks: List[TravelPlanningTask] = Field(
        default_factory=list, 
        description="List of tasks in execution sequence with completion summaries."
    )
    messages: List[str] = Field(
        default_factory=list, 
        description="User-facing agent status and execution trace messages."
    )

class TravelPlanResponse(BaseModel):
    success: bool = True
    planning_result: TravelPlanningResult
    execution: ExecutionSummary
    weather_context: Optional[WeatherResult] = None
    weather_insight: Optional[WeatherInsight] = None
    places_context: Optional[PlacesResult] = None
    ranked_attractions: Optional[List[RankedAttraction]] = None
    warning: Optional[str] = None
