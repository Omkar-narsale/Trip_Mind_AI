import logging
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

from app.services.llm_service import get_llm
from app.schemas.budget import (
    BudgetPlanRequest, 
    BudgetPlanResponse, 
    BudgetCategoryItem, 
    MoneySavingTip
)

logger = logging.getLogger(__name__)

# Standard conversion rates: 1 INR = X target currency
RATES_FROM_INR: Dict[str, float] = {
    "INR": 1.0,
    "USD": 0.0116,   # ~86.2 INR / USD
    "EUR": 0.0107,   # ~93.4 INR / EUR
    "GBP": 0.0091,   # ~109.8 INR / GBP
    "AED": 0.0425,   # ~23.5 INR / AED
    "JPY": 1.7300,   # ~0.58 INR / JPY
}

CURRENCY_SYMBOLS: Dict[str, str] = {
    "INR": "₹",
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "AED": "AED ",
    "JPY": "¥",
}

class LLMBudgetCategory(BaseModel):
    category_id: str = Field(..., description="stay, food, transit, entry_fees, or contingency")
    category_name: str = Field(..., description="Display title for this category")
    allocated_percentage: float = Field(..., description="Percentage of total budget, e.g. 38.0")
    description: str = Field(..., description="Detailed, destination-specific breakdown explanation")

class LLMBudgetResult(BaseModel):
    financial_summary: str = Field(..., description="Executive summary of how this budget will comfortably cover the trip")
    categories: List[LLMBudgetCategory] = Field(..., description="Breakdown covering stay, food, transit, entry_fees, contingency")
    saving_tips: List[MoneySavingTip] = Field(..., description="3-4 actionable destination-specific cost-saving hacks")

BUDGET_SYSTEM_PROMPT = """You are TripMind's Senior Travel Financial Economist & Budget Strategist.
Your goal is to build a realistic, destination-grounded visual budget allocation and practical cost-management plan.

CRITICAL RULES:
1. Cover exactly these 5 distinct categories:
   - "stay" (Stays & Accommodations)
   - "food" (Dining & Culinary)
   - "transit" (Local Transit & Transfers)
   - "entry_fees" (Attractions & Activities)
   - "contingency" (Contingency, Shopping & Extras)
2. Total percentages MUST sum up to approximately 100%.
3. Ground the costs realistically in the destination ({destination}), party size ({travelers} travelers), duration ({duration_days} days), and tier ({budget_tier}).
4. Provide authentic saving tips (e.g. composite tourist monuments tickets, local prepaid taxi counters, seasonal dining options)."""

BUDGET_USER_PROMPT = """Create an optimized budget breakdown for:
- Destination: {destination}
- Total Budget: ₹{total_budget:,.0f} INR
- Travelers: {travelers}
- Duration: {duration_days} days
- Budget Tier: {budget_tier}
- Style: {travel_style}
- Known Hotel Price/Night: {hotel_price_info}
- Known Attractions Count: {attractions_count}"""

class BudgetService:
    @classmethod
    async def calculate_budget_allocation(cls, req: BudgetPlanRequest) -> BudgetPlanResponse:
        total = float(req.total_budget)
        days = max(1, req.duration_days)
        travelers = max(1, req.travelers)
        per_day = total / days
        per_person = total / travelers

        hotel_info = f"₹{req.hotel_price_per_night:.0f}/night" if req.hotel_price_per_night else "Standard destination tier"
        attractions_info = str(req.attractions_count) if req.attractions_count else "5-8 major landmarks"

        try:
            llm = get_llm()
            structured_llm = llm.with_structured_output(LLMBudgetResult)

            prompt = ChatPromptTemplate.from_messages([
                ("system", BUDGET_SYSTEM_PROMPT),
                ("human", BUDGET_USER_PROMPT)
            ])

            chain = prompt | structured_llm

            llm_result: LLMBudgetResult = await chain.ainvoke({
                "destination": req.destination,
                "total_budget": total,
                "travelers": travelers,
                "duration_days": days,
                "budget_tier": req.budget_tier or "Moderate",
                "travel_style": req.travel_style or "Balanced Cultural",
                "hotel_price_info": hotel_info,
                "attractions_count": attractions_info
            })

            # Process LLM categories & normalize percentages
            raw_cats = llm_result.categories
            total_pct = sum(c.allocated_percentage for c in raw_cats) or 100.0

            icon_map = {
                "stay": "Building2",
                "food": "Utensils",
                "transit": "Car",
                "entry_fees": "Ticket",
                "contingency": "ShieldAlert"
            }

            final_categories: List[BudgetCategoryItem] = []
            allocated_so_far = 0.0

            for i, cat in enumerate(raw_cats):
                norm_pct = round((cat.allocated_percentage / total_pct) * 100.0, 1)
                
                # Last item balances the remaining currency to match total exactly
                if i == len(raw_cats) - 1:
                    cat_amount = round(total - allocated_so_far, 2)
                else:
                    cat_amount = round((norm_pct / 100.0) * total, 2)
                    allocated_so_far += cat_amount

                cat_daily = round(cat_amount / days, 2)
                cat_per_traveler = round(cat_amount / travelers, 2)

                final_categories.append(BudgetCategoryItem(
                    category_id=cat.category_id.lower(),
                    category_name=cat.category_name,
                    allocated_amount=cat_amount,
                    percentage=norm_pct,
                    daily_allocated=cat_daily,
                    per_traveler_allocated=cat_per_traveler,
                    description=cat.description,
                    icon=icon_map.get(cat.category_id.lower(), "CircleDollarSign")
                ))

            return BudgetPlanResponse(
                destination=req.destination,
                total_budget=total,
                currency_base="INR",
                travelers=travelers,
                duration_days=days,
                budget_per_day=round(per_day, 2),
                budget_per_traveler=round(per_person, 2),
                categories=final_categories,
                rates_from_inr=RATES_FROM_INR,
                currency_symbols=CURRENCY_SYMBOLS,
                saving_tips=llm_result.saving_tips,
                financial_summary=llm_result.financial_summary
            )

        except Exception as e:
            logger.warning(f"LLM budget generation failed or timed out: {e}. Utilizing deterministic financial heuristics.")
            return cls._fallback_allocation(req)

    @classmethod
    def _fallback_allocation(cls, req: BudgetPlanRequest) -> BudgetPlanResponse:
        total = float(req.total_budget)
        days = max(1, req.duration_days)
        travelers = max(1, req.travelers)
        per_day = total / days
        per_person = total / travelers
        dest = req.destination

        # Deterministic ratio model
        ratios = [
            ("stay", "Stay & Accommodations", 0.38, "Building2", f"Accommodates {days - 1 if days > 1 else 1} nights in comfortable central properties in {dest}."),
            ("food", "Dining & Culinary", 0.25, "Utensils", f"Covers 3 meals daily plus authentic tea/coffee and local street food for {travelers} travelers."),
            ("transit", "Local Transit & Transfers", 0.15, "Car", f"Covers private cabs, autos, and airport/station transfers throughout {dest}."),
            ("entry_fees", "Attractions & Entry Fees", 0.12, "Ticket", f"Dedicated for monument entry tickets, museum permits, and activity passes."),
            ("contingency", "Contingency & Shopping", 0.10, "ShieldAlert", f"Buffer for local artisan souvenirs, unplanned tips, and medical reserves.")
        ]

        categories: List[BudgetCategoryItem] = []
        allocated_so_far = 0.0

        for i, (cat_id, name, ratio, icon, desc) in enumerate(ratios):
            pct = round(ratio * 100.0, 1)
            if i == len(ratios) - 1:
                amt = round(total - allocated_so_far, 2)
            else:
                amt = round(total * ratio, 2)
                allocated_so_far += amt

            categories.append(BudgetCategoryItem(
                category_id=cat_id,
                category_name=name,
                allocated_amount=amt,
                percentage=pct,
                daily_allocated=round(amt / days, 2),
                per_traveler_allocated=round(amt / travelers, 2),
                description=desc,
                icon=icon
            ))

        saving_tips = [
            MoneySavingTip(
                title=f"Book Composite Monument Tickets in {dest}",
                tip=f"Check for heritage combo tickets covering multiple palaces/museums in {dest} to save up to 40% compared to separate admissions.",
                impact="High"
            ),
            MoneySavingTip(
                title="Use App-based Taxis or Pre-negotiated Day Cabs",
                tip="App-based cab services or pre-booking a private day taxi through your hotel desk eliminates repetitive tourist surges.",
                impact="Moderate"
            ),
            MoneySavingTip(
                title="Mid-day Dining at Iconic Heritage Cafes",
                tip="Enjoy lunch at legendary local bistros and thali spots rather than high-end hotel dinners for authentic taste at a fraction of the cost.",
                impact="Helpful"
            )
        ]

        summary = f"Your ₹{total:,.0f} budget for {travelers} traveler{'s' if travelers > 1 else ''} over {days} days provides a balanced ₹{per_day:,.0f}/day allocation, prioritizing comfortable stays and culinary discoveries while maintaining a healthy 10% safety reserve."

        return BudgetPlanResponse(
            destination=dest,
            total_budget=total,
            currency_base="INR",
            travelers=travelers,
            duration_days=days,
            budget_per_day=round(per_day, 2),
            budget_per_traveler=round(per_person, 2),
            categories=categories,
            rates_from_inr=RATES_FROM_INR,
            currency_symbols=CURRENCY_SYMBOLS,
            saving_tips=saving_tips,
            financial_summary=summary
        )

budget_service = BudgetService()
