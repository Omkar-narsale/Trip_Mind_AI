# 🌍 TripMind AI: Complete System Architecture, AI Models & Feature Guide

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
