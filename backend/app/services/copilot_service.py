import logging
from typing import List
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.services.llm_service import get_llm
from app.schemas.copilot import TripChatRequest, TripChatResponse
from app.services.vector_db_service import vector_db_service

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

GROUNDED KNOWLEDGE BASE (Retrieved from Destination Vector Database):
{rag_knowledge}

CONCIERGE DIRECTIVES:
1. Be concise, warm, knowledgeable, and elegant.
2. Ground all advice in their actual destination, anchor hotel, scheduled activities, and vector-retrieved destination rules.
3. If they ask about safety, emergency numbers, or scams, prioritize the verified facts retrieved from the vector knowledge base above.
4. If they ask about transit (taxis, IC cards, metro rules), quote the verified local transport rules retrieved above.
5. If they ask about packing, factor in their destination's climate and activities.
6. If they ask about food or cafes, suggest real, authentic culinary spots near their hotel or sights.
7. Provide 2-3 short, highly relevant follow-up suggestion chips that the user can ask next."""

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

            # Query Destination Vector DB for grounded knowledge
            rag_chunks = vector_db_service.query(
                destination=req.destination,
                query_text=req.message,
                top_k=2
            )
            if rag_chunks:
                rag_knowledge = "\n".join([f"- [{c.category.upper()}] {c.title}: {c.text}" for c in rag_chunks])
            else:
                rag_knowledge = "Standard verified destination advisories apply."

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
                "rag_knowledge": rag_knowledge,
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
