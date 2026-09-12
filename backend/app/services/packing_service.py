import logging
from typing import List
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.services.llm_service import get_llm
from app.schemas.packing import PackingRequest, PackingResponse, PackingItem, TravelAdvisory

logger = logging.getLogger(__name__)

class LLMPackingResult(BaseModel):
    climate_summary: str = Field(..., description="Concise analysis of expected temperatures, rain, and terrain")
    items: List[PackingItem] = Field(..., description="Curated packing list items across Clothing, Footwear, Health, Electronics, Documents")
    advisories: List[TravelAdvisory] = Field(..., description="Regional advisories covering connectivity, permits, currency, customs")

PACKING_SYSTEM_PROMPT = """You are TripMind Packing & Travel Readiness Engine.
Generate an authentic, highly practical, weather-responsive packing checklist and regional advisories for the traveler.

CATEGORIES MUST INCLUDE:
- "Clothing & Layers": Thermal base layers, sweaters, breathable shirts, jackets, rain gear depending on climate.
- "Footwear": Comfortable broken-in walking shoes, warm socks, sandals.
- "Health & Toiletries": Sun protection, lip balm, altitude or motion sickness meds, moisturizer.
- "Electronics & Tech": Power banks, universal adapters, camera accessories.
- "Documents & Essentials": Govt photo IDs, emergency contacts, local currency notes.

DATA TRUTHFULNESS & GROUNDING:
1. Ground items in the specified destination and temperature range ({temperature_min}°C to {temperature_max}°C).
2. For cold or mountain climates (Kashmir, Himachal, Ladakh, Alps): emphasize windproof outer shells, thermal layers, warm beanies, lip balm.
3. For coastal/tropical climates (Goa, Kerala, Bali): emphasize linen, rashguards, waterproof pouches, sunscreen.
4. Include 2-4 actionable regional travel advisories (e.g. postpaid SIM requirements for J&K, cash preferences for small vendors, temple dress etiquette)."""

PACKING_USER_PROMPT = """Trip Details:
- Destination: {destination}
- Duration: {duration_days} days ({departure_date} to {return_date})
- Forecast Context: {weather_summary}
- Temperature: Low {temperature_min}°C, High {temperature_max}°C
- Travelers: {travelers}
- Style: {travel_style}

Generate a comprehensive packing checklist and regional travel advisories."""

class PackingService:
    @classmethod
    async def generate_packing_checklist(cls, req: PackingRequest) -> PackingResponse:
        t_min = req.temperature_min if req.temperature_min is not None else 8.0
        t_max = req.temperature_max if req.temperature_max is not None else 20.0

        try:
            llm = get_llm()
            structured_llm = llm.with_structured_output(LLMPackingResult)

            prompt = ChatPromptTemplate.from_messages([
                ("system", PACKING_SYSTEM_PROMPT),
                ("human", PACKING_USER_PROMPT)
            ])

            chain = prompt | structured_llm

            result: LLMPackingResult = await chain.ainvoke({
                "destination": req.destination,
                "duration_days": req.duration_days or 5,
                "departure_date": req.departure_date or "Upcoming",
                "return_date": req.return_date or "Upcoming",
                "weather_summary": req.weather_summary or "Moderate traveling weather",
                "temperature_min": t_min,
                "temperature_max": t_max,
                "travelers": req.travelers or 2,
                "travel_style": req.travel_style or "Balanced"
            })

            return PackingResponse(
                destination=req.destination,
                climate_summary=result.climate_summary,
                items=result.items,
                advisories=result.advisories
            )

        except Exception as e:
            logger.warning(f"Groq packing checklist generation failed: {e}. Utilizing curated fallback.")
            return cls._generate_fallback(req, t_min, t_max)

    @classmethod
    def _generate_fallback(cls, req: PackingRequest, t_min: float, t_max: float) -> PackingResponse:
        dest_lower = req.destination.lower()
        is_cold = t_min < 15 or any(k in dest_lower for k in ["kashmir", "srinagar", "manali", "ladakh", "shimla", "leh"])

        items = []

        # 1. Clothing & Layers
        if is_cold:
            items.extend([
                PackingItem(item_name="Thermal Base Layers (Top & Bottom)", reason=f"Crucial for chilly nights ({t_min}°C)", is_essential=True, category="Clothing & Layers"),
                PackingItem(item_name="Fleece Jacket or Woolen Sweater", reason="Insulating mid-layer for early morning tours", is_essential=True, category="Clothing & Layers"),
                PackingItem(item_name="Windproof & Water-Resistant Outer Coat", reason="Protects against sudden mountain breezes", is_essential=True, category="Clothing & Layers"),
                PackingItem(item_name="Comfortable Walking Trousers / Jeans", reason="Durable for sightseeing and transit", is_essential=True, category="Clothing & Layers"),
                PackingItem(item_name="Warm Woolen Scarf & Beanie Cap", reason="Essential head and neck warmth near lakes and peaks", is_essential=True, category="Clothing & Layers"),
            ])
        else:
            items.extend([
                PackingItem(item_name="Light Breathable Cotton & Linen Shirts", reason="Comfortable in warm daytime temperatures", is_essential=True, category="Clothing & Layers"),
                PackingItem(item_name="Light Evening Jacket / Shrug", reason="Mild breeze after sunset", is_essential=False, category="Clothing & Layers"),
                PackingItem(item_name="Comfortable Walking Shorts / Trousers", reason="Casual exploration of cultural landmarks", is_essential=True, category="Clothing & Layers"),
            ])

        # 2. Footwear
        items.extend([
            PackingItem(item_name="Sturdy Walking Shoes / Sneakers", reason="Comfortable traction across historical steps and cobblestones", is_essential=True, category="Footwear"),
            PackingItem(item_name="Merino Wool or Cushion Socks (3-4 pairs)", reason="Prevents blisters during long walking days", is_essential=True, category="Footwear"),
            PackingItem(item_name="Slip-on Casual Shoes or Loafers", reason="Convenient for entering shrines and heritage homes", is_essential=False, category="Footwear"),
        ])

        # 3. Health & Toiletries
        items.extend([
            PackingItem(item_name="SPF 50 Sunscreen & UV Lip Balm", reason="High-altitude sunlight and outdoor exposure", is_essential=True, category="Health & Toiletries"),
            PackingItem(item_name="Hydrating Cold Cream / Moisturizer", reason="Counters dry mountain winds", is_essential=True, category="Health & Toiletries"),
            PackingItem(item_name="Personal First-Aid (Pain relief, Antacid, Band-aids)", reason="Everyday peace of mind while on the road", is_essential=True, category="Health & Toiletries"),
        ])

        # 4. Electronics & Tech
        items.extend([
            PackingItem(item_name="High-Capacity Power Bank (10,000+ mAh)", reason="Phone battery drains faster in chilly weather and during GPS use", is_essential=True, category="Electronics & Tech"),
            PackingItem(item_name="Camera with Extra Storage Card", reason="For stunning landscape and architectural captures", is_essential=False, category="Electronics & Tech"),
            PackingItem(item_name="Universal Multi-Plug Travel Adapter", reason="Keeps all personal devices charged simultaneously", is_essential=False, category="Electronics & Tech"),
        ])

        # 5. Documents & Essentials
        items.extend([
            PackingItem(item_name="Government Photo ID (Aadhaar / Passport)", reason="Mandatory for hotel check-ins and regional checkpoints", is_essential=True, category="Documents & Essentials"),
            PackingItem(item_name="Physical Cash (₹2,000–₹5,000 in small denominations)", reason="Useful for boat tours, street craft shopping, and small tips", is_essential=True, category="Documents & Essentials"),
            PackingItem(item_name="Offline Download of Area Maps (Google / OSM)", reason="Reliable navigation in spotty cellular reception areas", is_essential=True, category="Documents & Essentials"),
        ])

        advisories = [
            TravelAdvisory(
                title="Cellular Connectivity Notice",
                description="Prepaid SIM cards from other Indian states frequently do not roam in Jammu & Kashmir. Ensure you carry a postpaid SIM (Airtel or Jio) or acquire a local connection on arrival.",
                advisory_type="connectivity"
            ),
            TravelAdvisory(
                title="Cash & Currency Advisory",
                description="While digital UPI payments are widespread in main market hubs, carry small denomination cash for lake shikaras, pony rides, and remote village vendors.",
                advisory_type="regulations"
            ),
            TravelAdvisory(
                title="Layered Dressing Strategy",
                description=f"Temperatures swing significantly from morning ({t_min}°C) to mid-afternoon ({t_max}°C). Dress in removable layers so you can adjust comfortably throughout the day.",
                advisory_type="climate"
            )
        ]

        summary = f"{req.destination} experiences daytime highs near {t_max}°C and cooler nights around {t_min}°C. Layered outerwear and comfortable walking shoes are strongly recommended."

        return PackingResponse(
            destination=req.destination,
            climate_summary=summary,
            items=items,
            advisories=advisories
        )

packing_service = PackingService()
