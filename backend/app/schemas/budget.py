from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class BudgetCategoryItem(BaseModel):
    category_id: str = Field(..., description="Unique identifier: stay, food, transit, entry_fees, contingency")
    category_name: str = Field(..., description="Display label e.g., Stays & Accommodation")
    allocated_amount: float = Field(..., description="Allocated budget in base currency (INR)")
    percentage: float = Field(..., description="Percentage of total budget")
    daily_allocated: float = Field(..., description="Daily allocated limit for this category")
    per_traveler_allocated: float = Field(..., description="Per traveler allocated amount")
    description: str = Field(..., description="Actionable itemized explanation of this allocation")
    icon: str = Field(default="CircleDollarSign", description="Lucide icon identifier")

class MoneySavingTip(BaseModel):
    title: str = Field(..., description="Headline of the tip")
    tip: str = Field(..., description="Specific money-saving advice for the destination")
    impact: str = Field(default="Moderate", description="High, Moderate, or Helpful")

class BudgetPlanRequest(BaseModel):
    destination: str = Field(..., description="Trip destination (e.g., Jaipur, Kashmir)")
    origin: Optional[str] = Field(default=None, description="Trip starting point")
    total_budget: float = Field(..., gt=0, description="Total budget amount in INR")
    travelers: int = Field(default=1, ge=1, description="Number of travelers")
    duration_days: int = Field(default=4, ge=1, description="Total trip duration in days")
    budget_tier: Optional[str] = Field(default="Moderate", description="Budget, Moderate, Premium, Luxury")
    hotel_price_per_night: Optional[float] = Field(default=None, description="Estimated or actual hotel cost per night")
    attractions_count: Optional[int] = Field(default=None, description="Number of planned sights")
    transit_mode: Optional[str] = Field(default=None, description="Primary local transit mode")
    travel_style: Optional[str] = Field(default=None, description="Travel style preferences")

class BudgetPlanResponse(BaseModel):
    destination: str
    total_budget: float
    currency_base: str = "INR"
    travelers: int
    duration_days: int
    budget_per_day: float
    budget_per_traveler: float
    categories: List[BudgetCategoryItem] = Field(default_factory=list)
    rates_from_inr: Dict[str, float] = Field(default_factory=dict, description="1 INR in target currencies")
    currency_symbols: Dict[str, str] = Field(default_factory=dict)
    saving_tips: List[MoneySavingTip] = Field(default_factory=list)
    financial_summary: str = Field(..., description="Executive summary of the financial plan")
