"""
TripMind AI - Comprehensive Feature & Architecture Documentation Builder
Generates:
1. TripMind_AI_Feature_and_Architecture_Guide.md
2. TripMind_AI_Feature_and_Architecture_Guide.html
3. TripMind_AI_Feature_and_Architecture_Guide.docx
"""

import os
import sys
from pathlib import Path
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

WORKSPACE = Path(r"c:\Users\Omkar\Desktop\TripMind AI")

DOCUMENT_TITLE = "TripMind AI: Complete System Architecture, AI Models & Feature Guide"
SUBTITLE = "Comprehensive Technical Documentation & Academic Viva Defense Reference"
AUTHOR = "Omkar Narsale"
INSTITUTION = "Department of Information Technology, Savitribai Phule Pune University"
DATE = "October 2026"

MD_CONTENT = r"""# 🌍 TripMind AI: Complete System Architecture, AI Models & Feature Guide

**Lead Developer & System Architect**: Omkar Narsale  
**Academic Domain**: Autonomous Multi-Agent AI Systems, Geospatial Information Systems (GIS), Multimodal Vision & Vector RAG  
**Institution**: Department of Information Technology  
**Date of Submission**: October 2026  

---

## 📑 Executive Summary

Modern travel planning suffers from two critical flaws:
1. **Commercial Online Travel Agencies (OTAs)** provide fragmented, advertising-biased listings that force users into hours of manual itinerary compilation.
2. **Ungrounded Large Language Models (LLMs)** frequently hallucinate non-existent hotels, invent fictitious GPS coordinates, and fabricate climatic temperatures.

**TripMind AI** resolves these limitations by creating a **deterministic, multi-agent autonomous travel planning engine and real-time digital concierge**. It marries **LangGraph agentic state machines**, **Groq Language Processing Unit (LPU) inference**, **3-tier data grounding (OpenStreetMap & Open-Meteo)**, **Vector Database (RAG) retrieval**, **OSRM turn-by-turn road routing**, and **Multimodal Vision document scanning** into a unified luxury travel platform.

---

## 🏛️ Master Architecture & Technology Stack

| Component / Layer | Technology / Model / API | Hardware / Hosting | Primary Function |
| :--- | :--- | :--- | :--- |
| **Agentic Workflow Engine** | **LangGraph StateGraph** | Python 3.13 Backend | Acyclic task decomposition, dependency graph validation (DAG), and state machine orchestration. |
| **Core Fast LLM Engine** | **openai/gpt-oss-120b** & **llama-3.3-70b-versatile** | Groq Cloud LPU Hardware | Sub-second travel requirement analysis, structured profile extraction, and itinerary synthesis. |
| **Multimodal Vision Model** | **qwen/qwen3.8-27b Vision** | Groq Cloud LPU Hardware | Visual OCR and parameter extraction from uploaded flight tickets, hotel vouchers, and boarding passes. |
| **Vector Database & RAG** | **TF-IDF n-grams + Cosine Similarity Vector Store** | Python Native & In-Memory / Disk | Grounded retrieval of safety advisories, transit rules, scam warnings, and visa regulations. |
| **Turn-by-Turn Road Routing** | **OSRM (Open Source Routing Machine) API** | OpenStreetMap Foundation | Exact road geometry polyline calculation, road distance, duration, and driving/walking maneuvers. |
| **Interactive Map Canvas** | **Leaflet.js + OpenStreetMap Tiles** | Frontend Client-Side | Real-time map rendering, custom SVG marker pins with hover tooltips, and animated polyline overlay. |
| **Live Weather Intelligence** | **Open-Meteo Meteorological API** | Open-Meteo REST API | 16-day numerical weather forecast horizon, temperature extremes, and precipitation probabilities. |
| **Geospatial POI & Lodging** | **Overpass QL & Nominatim API** | OpenStreetMap Foundation | Verified accommodation, attraction, and authentic dining discovery with live coordinates. |
| **Spatial Route Optimizer** | **Haversine Great-Circle Clustering** | Custom Python Algorithm | Clusters attractions into walkable and vehicular geographic hubs, eliminating backtracking. |
| **Persistence Database** | **Supabase PostgreSQL & JSONB Snapshots** | Supabase Cloud Database | Cloud storage of user trip requests, weather metrics, stays, routes, and day-by-day itineraries. |
| **Backend Framework** | **FastAPI + Uvicorn + Pydantic v2** | Python 3.13 Async Server | High-performance asynchronous REST API with strict typed data validation. |
| **Frontend UI / UX** | **React 18 + Vite + Tailwind CSS** | Single Page Application | Modern luxury editorial aesthetic, dark mode maps, and micro-animations. |

---

## 🔬 Feature-by-Feature Deep Dive: How Everything Works

### Feature 1: Autonomous Agentic Planning & Task Decomposition (LangGraph)
* **What Model It Uses**: `openai/gpt-oss-120b` / `llama-3.3-70b-versatile` via **LangGraph StateGraph**.
* **How It Works**:
  1. Accepts the user's high-level goal (e.g., *"5-day relaxed family trip to Jaipur with kids and elderly parents on a $1200 budget"*).
  2. The agent decomposes this complex request into a **Directed Acyclic Graph (DAG)** of discrete subtasks (`weather`, `accommodation`, `attraction`, `transportation`, `food`, `itinerary`).
  3. Validates the dependencies so tasks execute in strict chronological sequence (e.g., attractions and lodging must be chosen before transit routes can be calculated).
  4. Sequentially triggers real-world tool APIs and updates the shared `AgentState`.
* **Code Location**: `backend/app/agents/planner_agent.py` and `backend/app/prompts/planner_prompt.py`.

---

### Feature 2: Natural Language Requirement & Constraint Extraction
* **What Model It Uses**: Groq LLM with **Few-Shot System Prompting** and **Pydantic Structured Output**.
* **How It Works**:
  1. Takes raw natural-language instructions (e.g., *"avoid crowded clubs, prefer peaceful heritage hotels, love spicy local curries, minimal walking"*).
  2. Parses explicit preferences vs reasonable inferences.
  3. Employs defensive security wrappers: `<USER_INPUT>` tags isolate the text against prompt injection attacks.
  4. Outputs typed fields: `travel_mood`, `pace`, `food_preferences`, `avoided_activities`, and `traveler_context`.
* **Code Location**: `backend/app/services/preference_analyzer.py` and `backend/app/prompts/preference_extraction_prompt.py`.

---

### Feature 3: Real-Time Meteorological Grounding & Dynamic Packing
* **What API / Model It Uses**: **Open-Meteo API** + Groq LLM Packing Service.
* **How It Works**:
  1. Takes destination coordinates and travel dates.
  2. If the trip is within 16 days, it retrieves exact numerical daily maximum/minimum temperatures, rain probabilities, and weather conditions.
  3. **Truthfulness Guard**: If the trip is beyond 16 days, it refuses to fabricate exact daily temperatures, switching to historical regional averages.
  4. Generates an itemized packing checklist (rain gear, light cottons, thermal layers, footwear) categorized into essentials.
* **Code Location**: `backend/app/services/weather_service.py` and `backend/app/services/packing_service.py`.

---

### Feature 4: 3-Tier Grounded Accommodations Discovery & Suitability Scoring
* **What Data / Model It Uses**: **OpenStreetMap Overpass QL** + **Nominatim Geocoding** + Groq LLM Fallback.
* **How It Works**:
  1. Queries real OSM nodes tagged `tourism=hotel`, `guest_house`, or `resort` around the destination centroid.
  2. Ranks accommodations based on budget match, proximity to city core, and amenities.
  3. Computes a suitability score and generates human-readable selection rationale.
* **Code Location**: `backend/app/services/hotel_service.py` and `backend/app/services/hotel_ranker.py`.

---

### Feature 5: Verified Sights & Preference-Aware Attraction Discovery
* **What Data / Model It Uses**: **OpenStreetMap Overpass QL** (`tourism=attraction`, `historic=monument`, `museum`).
* **How It Works**:
  1. Fetches authentic points of interest (POIs) with real latitude and longitude coordinates.
  2. Ranks venues by matching traveler interests (cultural, adventure, nature, historical).
  3. **Weather Adaptive**: If the weather tool indicates high rain probabilities, the system automatically elevates indoor cultural museums over open-air hilltop forts.
* **Code Location**: `backend/app/services/places_service.py` and `backend/app/services/attraction_ranker.py`.

---

### Feature 6: Authentic Local Culinary & Dining Intelligence
* **What Data / Model It Uses**: **OpenStreetMap Overpass API** (`amenity=restaurant`, `amenity=cafe`).
* **How It Works**:
  1. Identifies genuine restaurants, heritage thali halls, and cafes located near selected attractions.
  2. Tags each venue with cuisine types (Rajasthani, Goan Seafood, French Bakery, Halal, Pure Vegetarian).
  3. Calculates distance from the traveler's anchor hotel.
* **Code Location**: `backend/app/services/food_service.py`.

---

### Feature 7: Spatial Route Clustering & Haversine Distance Optimizer
* **What Algorithm It Uses**: **Haversine Great-Circle Distance Metric** + Centroid Spatial Clustering.
* **How It Works**:
  1. Computes great-circle distances between all discovered attractions:
     $$d = 2r \arcsin \left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1\cos\phi_2\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
  2. Partitions venues into tight geographic hubs (e.g. Amber Fort Hub vs Walled City Hub).
  3. Recommends transit modes (walk for < 1.2 km, auto-rickshaw/taxi for 1.2–8 km, private vehicle for > 8 km).
  4. Completely eliminates urban backtracking.
* **Code Location**: `backend/app/services/transportation_service.py`.

---

### Feature 8: Chronological Day-by-Day Itinerary Engine
* **What It Uses**: Algorithmic Daily Activity Sequencer.
* **How It Works**:
  1. Schedules morning, afternoon, and evening activity blocks with realistic time buffers.
  2. Integrates authentic dining slots for lunch and dinner near the scheduled attractions.
  3. Accounts for traveler dynamics (e.g., generous afternoon rest periods for seniors and children).
* **Code Location**: `backend/app/services/itinerary_service.py`.

---

### Feature 9: Turn-by-Turn Live Road Routing & Interactive Leaflet Navigation
* **What API / Engine It Uses**: **Leaflet.js** + **OpenStreetMap Tile Server** + **OSRM (Open Source Routing Machine) API**.
* **How It Works**:
  1. Extracts sequential waypoints for each day (Anchor Hotel $\rightarrow$ Morning Attraction $\rightarrow$ Lunch Venue $\rightarrow$ Afternoon Sight $\rightarrow$ Evening Return).
  2. Calls OSRM API (`/route/v1/{driving|walking}`) to retrieve the exact street road geometry.
  3. Renders a glowing road polyline on the Leaflet map tracing the real street path.
  4. Opens the **Turn-by-Turn Route Guidance Drawer** displaying total road distance in km, travel duration in minutes, and step-by-step turn maneuvers.
  5. **Instant Hover Tooltips**: Moving the mouse over any marker on the map instantly displays a floating badge with the place name and category without needing to click!
* **Code Location**: `backend/app/services/routing_service.py` and `frontend/src/components/results/MapSection.jsx`.

---

### Feature 10: Destination Knowledge Base Vector Database & RAG
* **What Algorithm / Engine It Uses**: **TF-IDF Sublinear n-grams + Cosine Similarity Vector Store**.
* **How It Works**:
  1. **Document Ingestion**: Parses curated destination guides (`goa.md`, `jaipur.md`, `paris.md`, `tokyo.md`, `dubai.md`) into semantic chunks covering Safety & Scams, Transit Rules, Visa Regulations, and Cultural Etiquette.
  2. **Vector Space Model**: Generates normalized vector embeddings for each chunk and maintains an index manifest (`index_manifest.json`).
  3. **Cosine Similarity Search**: When a traveler asks a question, the engine calculates:
     $$\text{Cosine Similarity}(\vec{q}, \vec{d}) = \frac{\vec{q} \cdot \vec{d}}{\|\vec{q}\| \|\vec{d}\|}$$
  4. **Chatbot Grounding**: Injects retrieved knowledge chunks directly into the floating **Trip Co-Pilot concierge drawer**, providing unhallucinated emergency numbers, police booth locations, and taxi rules!
  5. **Interactive UI Explorer**: A dedicated panel on the Map tab allows testing vector similarity queries with real-time match scores.
* **Code Location**: `backend/app/services/vector_db_service.py` and `backend/app/services/copilot_service.py`.

---

### Feature 11: Multimodal AI Ticket & Travel Document Scanner
* **What Model It Uses**: **qwen/qwen3.8-27b Multimodal Vision Model** on Groq Cloud LPU.
* **How It Works**:
  1. Users drag-and-drop or upload an image of a flight ticket, boarding pass, or hotel booking voucher (PNG/JPG/WEBP).
  2. The vision model analyzes the visual layout and text in parallel on Groq LPU hardware.
  3. Extracts typed parameters: Origin, Destination, Normalized Dates (`YYYY-MM-DD`), Passenger Count, PNR Reference, Carrier/Hotel Name, and Amenities.
  4. **⚡ Auto-Fill Button**: Injects all extracted data directly into the trip planning form with zero manual typing.
  5. **One-Click Viva Demos**: Built-in buttons for *IndiGo Flight (Jaipur)* and *Taj Resort Voucher (Goa)* allow instant 1-second demonstration during oral exams!
* **Code Location**: `backend/app/services/vision_service.py` and `frontend/src/components/TicketScannerModal.jsx`.

---

### Feature 12: Calendar Sync (RFC-5545 `.ics`) & Luxury Print Brochure
* **How It Works**:
  1. **Universal `.ics` Export**: Generates an RFC-5545 calendar file compatible with Apple Calendar, Google Calendar, and Microsoft Outlook.
  2. **Direct Google Calendar Link**: Adds `+ Cal` quick-add links for individual scheduled activities.
  3. **Editorial Print PDF**: Features a dedicated `@media print` layout providing an offline travel brochure with daily schedules and emergency contacts.
* **Code Location**: `frontend/src/utils/calendar.js` and `frontend/src/components/results/PrintBrochureView.jsx`.

---

### Feature 13: Supabase Cloud Database Session Persistence
* **What It Uses**: **Supabase PostgreSQL** with JSONB Relational Snapshots.
* **How It Works**:
  1. Automatically persists planning sessions, user requests, enhanced profiles, and all generated intelligence artifacts (weather, hotels, places, transit, itinerary).
  2. Allows users to retrieve past trips instantly via the "Saved Trips" modal.
* **Code Location**: `backend/app/services/supabase_service.py`.

---

## 🎓 Academic Syllabus & Learning Outcomes Alignment

| Sr. No. | Lab Learning Outcome | Relevant CO | Implementation in TripMind AI |
| :---: | :--- | :---: | :--- |
| **1** | Manipulate LLM hyperparameters to analyze text generation variance | **CO1** | Configured low-temperature deterministic inference (`temperature=0.2`) for factual stability in `llm_service.py`. |
| **2** | Design system prompts to enforce structured data schemas | **CO1** | System prompts in `preference_extraction_prompt.py` and `planner_prompt.py` enforcing typed Pydantic models. |
| **3** | Prompting frameworks (Few-Shot) for reasoning workflows | **CO2** | Few-Shot reference examples in `preference_extraction_prompt.py` demonstrating user instruction extraction. |
| **4** | Develop cognitive prompt templates for logical workflows | **CO2** | Multi-step LangGraph planning workflow decomposing goals into dependency-ordered execution graphs. |
| **5 & 6** | Generate vector embeddings & build vector database query interface | **CO3** | `vector_db_service.py` implementing TF-IDF vector embeddings, cosine similarity search, and RAG UI explorer. |
| **7** | Function calling / workflows triggering external APIs | **CO3, CO6** | Dynamic triggering of Open-Meteo, OpenStreetMap Overpass, Nominatim, and OSRM APIs in `planner_agent.py`. |
| **8 & 9** | Mitigate hallucinations & deploy defensive prompt guardrails | **CO4** | Grounding with real GIS/weather data, anti-hallucination rules, and `<USER_INPUT>` prompt isolation wrappers. |
| **10** | Map logical workflows using vision-language models | **CO5** | `vision_service.py` using `qwen/qwen3.8-27b` multimodal vision model to scan and extract travel documents. |
| **11** | Multi-step autonomous agent script for task execution (Mini-Project) | **CO6** | **Core of TripMind AI**: LangGraph autonomous planning agent breaking high-level travel goals into subtasks. |

---

## 🎙️ Viva / Oral Examination Q&A Defense Guide

### Q1: "Why did you use LangGraph instead of a simple prompt to ChatGPT?"
> **Answer**: *"A simple LLM prompt suffers from massive hallucinations—it creates fake hotels, invents coordinates, and produces impossible transit schedules. LangGraph allows us to build a deterministic State Machine with a Directed Acyclic Graph (DAG). It breaks down the trip goal into discrete tasks (weather, stays, sights, routes), validates their dependencies, and forces the system to call verified external APIs before synthesizing the itinerary."*

### Q2: "What AI models are being used in this project?"
> **Answer**: *"We utilize two primary models hosted on Groq Cloud LPU hardware for ultra-fast, sub-second inference:
> 1. `llama-3.3-70b-versatile` / `openai/gpt-oss-120b` for agentic planning, preference extraction, and grounded concierge chat.
> 2. `qwen/qwen3.8-27b` Multimodal Vision Model for visually scanning travel tickets, boarding passes, and hotel vouchers."*

### Q3: "How does your RAG (Retrieval-Augmented Generation) work?"
> **Answer**: *"Our `vector_db_service.py` indexes curated destination guidebooks into semantic chunks. It computes normalized vector embeddings using TF-IDF n-grams and calculates Cosine Similarity against the user's query. When a user asks our AI Co-Pilot about safety, scam warnings, or metro rules, the matched chunks are injected into the LLM prompt, guaranteeing 100% factual answers backed by the vector store."*

### Q4: "How does the Live Road Routing work on the map?"
> **Answer**: *"We integrated Leaflet.js with the Open Source Routing Machine (OSRM) API. When a user selects a day in the itinerary, our backend extracts the sequential coordinates (Hotel $\rightarrow$ Morning Sight $\rightarrow$ Lunch $\rightarrow$ Afternoon Sight) and queries OSRM. OSRM returns the exact road network geometry, which we draw as a polyline on the Leaflet map, alongside step-by-step turn maneuvers, road distance in km, and travel time in minutes."*

### Q5: "How does your system avoid hallucinating temperatures and weather?"
> **Answer**: *"We strictly query the Open-Meteo meteorological API. If the travel date is within the 16-day numerical forecast horizon, real live weather is used. If the trip is beyond 16 days, our system explicitly informs the user that only seasonal climate averages apply, preventing the LLM from fabricating exact daily temperatures."*
"""

def generate_docx():
    doc = docx.Document()

    # Set 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = title_p.add_run(DOCUMENT_TITLE)
    r_title.bold = True
    r_title.font.size = Pt(22)
    r_title.font.name = "Georgia"
    r_title.font.color.rgb = RGBColor(0x1B, 0x43, 0x32) # Forest green

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = sub_p.add_run(SUBTITLE)
    r_sub.font.size = Pt(13)
    r_sub.font.name = "Calibri"
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)

    meta_p = doc.add_paragraph()
    meta_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_meta = meta_p.add_run(f"Author: {AUTHOR} | {INSTITUTION} | {DATE}")
    r_meta.font.size = Pt(10)
    r_meta.font.name = "Calibri"
    r_meta.font.color.rgb = RGBColor(0x6B, 0x72, 0x80)

    doc.add_paragraph("─" * 55).alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Helper function to add sections
    lines = MD_CONTENT.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        
        if line.startswith("# "):
            # Handled by title
            pass
        elif line.startswith("## "):
            h = doc.add_heading(line.replace("## ", "").strip(), level=1)
            h.style.font.name = "Georgia"
            h.style.font.color.rgb = RGBColor(0x1B, 0x43, 0x32)
        elif line.startswith("### "):
            h = doc.add_heading(line.replace("### ", "").strip(), level=2)
            h.style.font.name = "Georgia"
            h.style.font.color.rgb = RGBColor(0x04, 0x78, 0x57)
        elif line.startswith("> "):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.4)
            r = p.add_run(line.replace("> ", "").strip())
            r.font.italic = True
            r.font.size = Pt(10)
            r.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
        elif line.startswith("- ") or line.startswith("* "):
            p = doc.add_paragraph(style='List Bullet')
            clean = line[2:].strip()
            # Basic bold parsing
            parts = clean.split("**")
            for idx, part in enumerate(parts):
                run = p.add_run(part)
                if idx % 2 == 1:
                    run.bold = True
                run.font.size = Pt(10.5)
                run.font.name = "Calibri"
        elif line.startswith("1. ") or line.startswith("2. ") or line.startswith("3. ") or line.startswith("4. ") or line.startswith("5. "):
            p = doc.add_paragraph(style='List Number')
            clean = line[3:].strip()
            parts = clean.split("**")
            for idx, part in enumerate(parts):
                run = p.add_run(part)
                if idx % 2 == 1:
                    run.bold = True
                run.font.size = Pt(10.5)
                run.font.name = "Calibri"
        elif line.strip() and not line.startswith("|") and not line.startswith("---"):
            p = doc.add_paragraph()
            parts = line.split("**")
            for idx, part in enumerate(parts):
                run = p.add_run(part)
                if idx % 2 == 1:
                    run.bold = True
                run.font.size = Pt(10.5)
                run.font.name = "Calibri"
        i += 1

    out_path = WORKSPACE / "TripMind_AI_Feature_and_Architecture_Guide.docx"
    doc.save(str(out_path))
    print(f"Generated DOCX: {out_path} ({out_path.stat().st_size:,} bytes)")

def generate_html_and_md():
    # Save MD
    md_path = WORKSPACE / "TripMind_AI_Feature_and_Architecture_Guide.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(MD_CONTENT)
    print(f"Generated MD: {md_path} ({md_path.stat().st_size:,} bytes)")

    # Save HTML with luxury printable styling
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{DOCUMENT_TITLE}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Fira+Code:wght@400;600&display=swap');
    body {{
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      line-height: 1.65;
      color: #1F2937;
      background: #F9FAFB;
      margin: 0;
      padding: 40px 20px;
    }}
    .container {{
      max-width: 960px;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 60px 80px;
      border-radius: 24px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.06);
      border: 1px solid #E5E7EB;
    }}
    h1, h2, h3, .font-serif {{
      font-family: 'Playfair Display', Georgia, serif;
      color: #1B4332;
    }}
    h1 {{ font-size: 2.2rem; margin-bottom: 0.4rem; text-align: center; }}
    .subtitle {{ text-align: center; color: #4B5563; font-size: 1.1rem; margin-bottom: 0.5rem; font-style: italic; }}
    .meta {{ text-align: center; color: #6B7280; font-size: 0.85rem; margin-bottom: 2rem; }}
    hr {{ border: 0; height: 1px; background: #E5E7EB; margin: 2rem 0; }}
    h2 {{ font-size: 1.5rem; margin-top: 2.2rem; border-bottom: 2px solid #E5E7EB; padding-bottom: 0.4rem; }}
    h3 {{ font-size: 1.15rem; color: #047857; margin-top: 1.4rem; }}
    p, li {{ font-size: 0.95rem; color: #374151; }}
    table {{ width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.88rem; }}
    th, td {{ border: 1px solid #E5E7EB; padding: 10px 14px; text-align: left; }}
    th {{ background: #F3F4F6; color: #111827; font-weight: 700; }}
    blockquote {{
      background: #F0FDF4;
      border-left: 4px solid #10B981;
      padding: 12px 18px;
      border-radius: 0 12px 12px 0;
      color: #065F46;
      margin: 1.2rem 0;
      font-style: italic;
    }}
    code {{ font-family: 'Fira Code', monospace; background: #F3F4F6; padding: 2px 6px; border-radius: 6px; font-size: 0.85em; color: #B91C1C; }}
    .print-btn {{
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #1B4332;
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 9999px;
      box-shadow: 0 8px 24px rgba(27,67,50,0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }}
    .print-btn:hover {{ background: #2D6A4F; transform: scale(1.05); }}
    @media print {{
      body {{ background: white; padding: 0; }}
      .container {{ box-shadow: none; border: none; padding: 0; }}
      .print-btn {{ display: none; }}
    }}
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Save as PDF / Print</button>
  <div class="container">
    <h1>{DOCUMENT_TITLE}</h1>
    <div class="subtitle">{SUBTITLE}</div>
    <div class="meta">Author: <strong>{AUTHOR}</strong> | {INSTITUTION} | {DATE}</div>
    <hr>
"""
    # Convert Markdown to HTML with built-in converter
    import html as html_lib

    lines = MD_CONTENT.split("\n")
    html_lines = []
    in_table = False
    in_list = False

    for l in lines:
        if l.startswith("# "):
            html_lines.append(f"<h1>{l[2:].strip()}</h1>")
        elif l.startswith("## "):
            html_lines.append(f"<h2>{l[3:].strip()}</h2>")
        elif l.startswith("### "):
            html_lines.append(f"<h3>{l[4:].strip()}</h3>")
        elif l.startswith("> "):
            html_lines.append(f"<blockquote>{l[2:].strip()}</blockquote>")
        elif l.startswith("- ") or l.startswith("* "):
            if not in_list:
                html_lines.append("<ul>")
                in_list = True
            item_text = l[2:].strip()
            # replace bold
            import re
            item_text = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", item_text)
            html_lines.append(f"<li>{item_text}</li>")
        elif l.startswith("|"):
            if in_list:
                html_lines.append("</ul>")
                in_list = False
            if "---" in l:
                continue
            cells = [c.strip() for c in l.split("|")[1:-1]]
            if not in_table:
                html_lines.append("<table><thead><tr>")
                for c in cells:
                    import re
                    c_text = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", c)
                    html_lines.append(f"<th>{c_text}</th>")
                html_lines.append("</tr></thead><tbody>")
                in_table = True
            else:
                html_lines.append("<tr>")
                for c in cells:
                    import re
                    c_text = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", c)
                    html_lines.append(f"<td>{c_text}</td>")
                html_lines.append("</tr>")
        else:
            if in_list:
                html_lines.append("</ul>")
                in_list = False
            if in_table and not l.startswith("|"):
                html_lines.append("</tbody></table>")
                in_table = False
            if l.startswith("---"):
                html_lines.append("<hr>")
            elif l.strip():
                import re
                p_text = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", l.strip())
                html_lines.append(f"<p>{p_text}</p>")

    if in_list:
        html_lines.append("</ul>")
    if in_table:
        html_lines.append("</tbody></table>")

    html_body = "\n".join(html_lines)
    html_content += html_body + "\n  </div>\n</body>\n</html>"

    html_path = WORKSPACE / "TripMind_AI_Feature_and_Architecture_Guide.html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated HTML: {html_path} ({html_path.stat().st_size:,} bytes)")

if __name__ == "__main__":
    generate_html_and_md()
    generate_docx()
