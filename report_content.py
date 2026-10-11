"""
TripMind AI - Report Content Data Module
Contains structured text, tables, code snippets, and metadata for the IT Microproject Report.
"""

PROJECT_METADATA = {
    "title": "TripMind AI: Autonomous Agentic Travel Planning, Real-Time Grounded Intelligence & In-Trip Concierge Platform",
    "short_title": "TripMind AI",
    "domain": "Autonomous Agentic Artificial Intelligence, Geospatial Information Systems (GIS), Distributed Web Systems",
    "lead_developer": "Omkar Narsale",
    "role": "Lead System Architect & Full-Stack AI Engineer",
    "institution": "Department of Information Technology, Academic Institute of Technology / Savitribai Phule Pune University",
    "academic_year": "2025–2026",
    "submission_date": "October 2026",
    "supervisor": "Prof. Technical Project Guide",
    "hod": "Head of Department (Information Technology)",
    "repository": "https://github.com/Omkar-narsale/Trip_Mind_AI"
}
    
PRELIMINARY = {
    "certificate_text": (
        "This is to certify that the microproject entitled \"TripMind AI: Autonomous Agentic Travel Planning, "
        "Real-Time Grounded Intelligence & In-Trip Concierge Platform\" is a bona fide record of work carried out by "
        "Omkar Narsale in partial fulfillment of the requirements for the Degree / Diploma in Information Technology "
        "during the academic year 2025–2026. The work documented herein has been carried out under direct academic "
        "supervision and has reached the required standards of technical rigor, originality, and engineering merit."
    ),
    "declaration_text": (
        "I hereby declare that this microproject report titled \"TripMind AI: Autonomous Agentic Travel Planning, "
        "Real-Time Grounded Intelligence & In-Trip Concierge Platform\" submitted to the Department of Information "
        "Technology is an authentic record of our original technical work. All external libraries, datasets, cloud "
        "APIs, and algorithms utilized during development have been explicitly acknowledged and cited. This project "
        "has not formed the basis for the award of any other degree, diploma, or certificate to the best of our knowledge."
    ),
    "acknowledgements_text": (
        "We wish to express our profound gratitude to our project guide and supervisor for providing continuous "
        "technical direction, insightful feedback, and encouragement throughout the design and implementation of this "
        "autonomous agentic system. We extend our sincere thanks to the Head of Department and faculty members of the "
        "Department of Information Technology for their pedagogical guidance and lab infrastructure support.\n\n"
        "We also acknowledge the open-source software and geospatial communities, including the OpenStreetMap Foundation, "
        "the Overpass API maintainers, the Open-Meteo meteorological team, the LangChain & LangGraph project maintainers, "
        "Groq Cloud for ultra-fast LPU inference access, and the Supabase open-source team, whose robust tooling made "
        "real-time grounded agentic travel planning feasible."
    ),
    "abstract": (
        "Modern digital travel planning is fundamentally hindered by two contrasting paradigms: traditional Commercial "
        "Online Travel Agency (OTA) platforms that present fragmented, advertisement-driven directory listings requiring "
        "hours of manual itinerary assembly, and ungrounded Large Language Model (LLM) conversational chatbots that "
        "frequently hallucinate non-existent accommodations, fabricate GPS coordinates, and provide outdated climatic "
        "assumptions.\n\n"
        "To resolve these foundational shortcomings, this microproject presents TripMind AI, an autonomous agentic "
        "travel planning and real-time in-trip digital concierge engine. TripMind AI employs a deterministic, multi-tiered "
        "state machine orchestrated via LangGraph. The system accepts natural language criteria—including group dynamics, "
        "budget tiers, travel pace, dietary requirements, and mobility constraints—and decomposes the planning challenge "
        "into a verified Directed Acyclic Graph (DAG) of strategic subtasks.\n\n"
        "The core technical architecture introduces: (1) a 3-tier resilient data grounding engine querying live OpenStreetMap "
        "geodata via Overpass QL with Nominatim and Groq LLM real-world fallback hierarchies; (2) real-time meteorological "
        "grounding via Open-Meteo offering 16-day numerical forecasts and historical climate modeling; (3) spatial optimization "
        "via Haversine great-circle distance clustering to partition destinations into walkable and vehicular corridors, "
        "eliminating urban backtracking; (4) a day-by-day chronological scheduling engine that synthesizes morning, "
        "afternoon, and evening activity slots into universal RFC-5545 (.ics) calendar sync files and luxury print brochures; "
        "(5) an itemized multi-currency budget allocation engine; and (6) a persistent, context-grounded AI Trip Co-Pilot "
        "concierge drawer powered by Groq LPU (llama-3.3-70b-versatile) achieving sub-second inference. The system is backed "
        "by Supabase PostgreSQL utilizing relational JSONB snapshot persistence. Automated test suites validate zero "
        "hallucinations, acyclic DAG execution, and sub-3-second average end-to-end plan generation."
    )
}

ABBREVIATIONS = [
    ("API", "Application Programming Interface"),
    ("ASGI", "Asynchronous Server Gateway Interface"),
    ("CORS", "Cross-Origin Resource Sharing"),
    ("DAG", "Directed Acyclic Graph"),
    ("DFD", "Data Flow Diagram"),
    ("ERD", "Entity-Relationship Diagram"),
    ("GIS", "Geographic Information System"),
    ("GPS", "Global Positioning System"),
    ("HMR", "Hot Module Replacement"),
    ("HTTP", "Hypertext Transfer Protocol"),
    ("JSON", "JavaScript Object Notation"),
    ("JSONB", "Binary JavaScript Object Notation (PostgreSQL)"),
    ("JWT", "JSON Web Token"),
    ("LLM", "Large Language Model"),
    ("LPU", "Language Processing Unit (Groq Hardware)"),
    ("NLP", "Natural Language Processing"),
    ("ORM", "Object-Relational Mapping"),
    ("OSM", "OpenStreetMap"),
    ("OTA", "Online Travel Agency"),
    ("POI", "Point of Interest"),
    ("PWA", "Progressive Web Application"),
    ("REST", "Representational State Transfer"),
    ("RFC", "Request for Comments (Internet Engineering Task Force)"),
    ("RLS", "Row-Level Security"),
    ("SDG", "Sustainable Development Goals (United Nations)"),
    ("SPA", "Single Page Application"),
    ("SQL", "Structured Query Language"),
    ("UI / UX", "User Interface / User Experience"),
    ("UML", "Unified Modeling Language"),
    ("UUID", "Universally Unique Identifier"),
    ("Vite", "Next Generation Frontend Tooling / Bundler")
]
