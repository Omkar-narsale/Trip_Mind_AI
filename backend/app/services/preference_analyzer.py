import logging
from typing import Optional

from app.schemas.travel_preferences import ExtractedTravelPreferences
from app.prompts.preference_extraction_prompt import get_preference_extraction_prompt
from app.services.llm_service import get_llm

logger = logging.getLogger(__name__)

class PreferenceAnalyzerService:
    @classmethod
    async def extract_preferences(
        cls, 
        user_instructions: Optional[str], 
        destination: str = "Unspecified", 
        travelers: int = 1
    ) -> ExtractedTravelPreferences:
        """
        Extracts structured travel preferences from natural language instructions.
        Returns default empty preferences if input is empty or omitted.
        """
        if not user_instructions or not user_instructions.strip():
            return ExtractedTravelPreferences(
                confidence_notes="No natural language instructions provided by user."
            )

        try:
            llm = get_llm()
            prompt_template = get_preference_extraction_prompt()

            structured_llm = llm.with_structured_output(ExtractedTravelPreferences)
            chain = prompt_template | structured_llm

            result: ExtractedTravelPreferences = await chain.ainvoke({
                "user_instructions": user_instructions.strip(),
                "destination": destination,
                "travelers": travelers
            })

            return result

        except ValueError as val_err:
            logger.error(f"Configuration or validation error in PreferenceAnalyzer: {val_err}")
            raise val_err

        except Exception as e:
            logger.warning(f"Groq LLM preference extraction could not parse input (e.g. non-travel content or refusal): {str(e)}")
            # Return safe empty preferences with explanatory confidence note rather than crashing
            return ExtractedTravelPreferences(
                confidence_notes="Input text could not be mapped to travel preferences or contained non-travel instructions."
            )

preference_analyzer_service = PreferenceAnalyzerService()
