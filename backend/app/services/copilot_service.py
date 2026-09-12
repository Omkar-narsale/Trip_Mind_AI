import logging
from typing import List
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.services.llm_service import get_llm
from app.schemas.copilot import TripChatRequest, TripChatResponse

logger = logging.getLogger(__name__)

class LLMCopilotOutput(BaseModel):
    reply: str = Field(..., description="Warm, highly practical, luxury travel concierge advice formatted in clear markdown paragraphs or bullet points.")
    suggested_followups: List[str] = Field(default_factory=list, description="2 to 4 concise follow-up questions or prompts the traveler might click next.")

COPILOT_SYSTEM_PROMPT = """You are TripMind Concierge, the ultra-smart, sophisticated AI travel companion and in-trip co-pilot.
You are assisting a traveler with their specific trip plan.

CURRENT TRIP PROFILE:
- Destination: {destination}
- Origin: {origin}
- Dates: {departure_date} to {return_date}
- Party Size: {travelers} traveler(s)
- Budget: {budget}
- Anchor Hotel: {hotel_name}
- Weather Overview: {weather_summary}
- Trip Context & Style: {trip_summary}
- Key Planned Activities: {activities_text}

CONCIERGE DIRECTIVES:
1. Be concise, warm, knowledgeable, and elegant.
2. Ground all advice in their actual destination, anchor hotel, and scheduled activities.
3. If they ask about packing, factor in their destination's climate and activities.
4. If they ask about food or cafes, suggest real, authentic culinary spots near their hotel or sights.
5. If they ask to modify or slow down pacing, provide actionable advice on which stops can be relaxed or skipped.
6. Provide 2-3 short, highly relevant follow-up suggestion chips that the user can ask next."""

COPILOT_USER_PROMPT = """Traveler's Message:
"{message}"

Provide an insightful, helpful concierge response and 2-3 dynamic follow-up suggestion chips."""

class CopilotService:
    @classmethod
    async def chat(cls, req: TripChatRequest) -> TripChatResponse:
        try:
            llm = get_llm()
            structured_llm = llm.with_structured_output(LLMCopilotOutput)

            activities_str = ", ".join(req.activities_summary[:8]) if req.activities_summary else "Key local sightseeing stops"

            prompt = ChatPromptTemplate.from_messages([
                ("system", COPILOT_SYSTEM_PROMPT),
                ("human", COPILOT_USER_PROMPT)
            ])

            chain = prompt | structured_llm

            result: LLMCopilotOutput = await chain.ainvoke({
                "destination": req.destination,
                "origin": req.origin or "Not specified",
                "departure_date": req.departure_date or "Upcoming",
                "return_date": req.return_date or "Upcoming",
                "travelers": req.travelers or 1,
                "budget": f"₹{req.budget:,.0f}" if req.budget else "Flexible",
                "hotel_name": req.hotel_name or "Central accommodation",
                "weather_summary": req.weather_summary or "Pleasant traveling conditions",
                "trip_summary": req.trip_summary or "Curated leisure journey",
                "activities_text": activities_str,
                "message": req.message
            })

            return TripChatResponse(
                reply=result.reply,
                suggested_followups=result.suggested_followups or [
                    f"What should I pack for {req.destination}?",
                    f"Best evening viewpoints in {req.destination}",
                    "Tips for local transport"
                ]
            )

        except Exception as e:
            logger.error(f"Error in CopilotService chat: {e}", exc_info=True)
            # Graceful fallback response
            return TripChatResponse(
                reply=(
                    f"I'm here to assist with your journey to **{req.destination}**! "
                    f"While staying at {req.hotel_name or 'your hotel'}, remember to allow ample time between transfers. "
                    "Feel free to ask about packing, local dining specialties, or pacing adjustments!"
                ),
                suggested_followups=[
                    f"What should I pack for {req.destination}?",
                    "Best local dining spots",
                    "Safety and transit tips"
                ]
            )

copilot_service = CopilotService()
