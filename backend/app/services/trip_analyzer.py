import logging
from datetime import datetime
from typing import Optional

from app.schemas.trip import TripCreate
from app.schemas.trip_analysis import TripAnalysis, TripAnalysisResponse, BudgetLevel
from app.prompts.trip_analysis_prompt import get_trip_analysis_prompt
from app.services.llm_service import get_llm

logger = logging.getLogger(__name__)

class TripAnalyzerService:
    @staticmethod
    def _calculate_days(dep_date_str: str, ret_date_str: str) -> int:
        """Helper to calculate total inclusive trip days."""
        try:
            d1 = datetime.strptime(dep_date_str, "%Y-%m-%d")
            d2 = datetime.strptime(ret_date_str, "%Y-%m-%d")
            diff = (d2 - d1).days + 1
            return max(1, diff)
        except Exception:
            return 1

    @classmethod
    async def analyze_trip(cls, trip_data: TripCreate) -> TripAnalysisResponse:
        """
        Executes Groq LLM structured trip goal analysis on incoming trip request.
        """
        prompt_template = get_trip_analysis_prompt()
        
        # Format human prompt parameters
        formatted_preferences = ", ".join(trip_data.preferences) if trip_data.preferences else "None specified"
        
        # Calculate baseline metrics for validation & fallback
        duration_days = cls._calculate_days(trip_data.departure_date, trip_data.return_date)
        budget_per_traveler = round(trip_data.budget / max(1, trip_data.travelers), 2)
        budget_per_day = round(trip_data.budget / max(1, duration_days), 2)

        try:
            # Get cached ChatGroq instance
            llm = get_llm()

            # Bind structured output with Pydantic schema
            structured_llm = llm.with_structured_output(TripAnalysis)
            chain = prompt_template | structured_llm

            # Invoke async chain
            result: TripAnalysis = await chain.ainvoke({
                "origin": trip_data.origin,
                "destination": trip_data.destination,
                "departure_date": trip_data.departure_date,
                "return_date": trip_data.return_date,
                "travelers": trip_data.travelers,
                "budget": trip_data.budget,
                "preferences": formatted_preferences
            })

            # Ensure duration & budget calculations are strictly positive and coherent
            if result.duration_days <= 0:
                result.duration_days = duration_days
            if result.budget_per_traveler <= 0:
                result.budget_per_traveler = budget_per_traveler
            if result.budget_per_day <= 0:
                result.budget_per_day = budget_per_day

            return TripAnalysisResponse(
                success=True,
                analysis=result
            )

        except ValueError as val_err:
            # Handles missing GROQ_API_KEY or configuration errors explicitly
            logger.error(f"Configuration or validation error in TripAnalyzer: {val_err}")
            raise val_err

        except Exception as e:
            logger.error(f"Error during Groq LLM analysis invocation: {str(e)}", exc_info=True)
            raise RuntimeError(f"AI Goal Analyzer encountered an error: {str(e)}")

trip_analyzer_service = TripAnalyzerService()
