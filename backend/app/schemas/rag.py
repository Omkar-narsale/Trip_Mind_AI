from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RAGChunk(BaseModel):
    chunk_id: str = Field(..., description="Unique deterministic identifier for vector chunk")
    destination: str = Field(..., description="Destination location key (e.g. goa, jaipur, paris)")
    category: str = Field(..., description="Category: safety, transit, visa, culture, general")
    title: str = Field(..., description="Section title or topic header")
    text: str = Field(..., description="Grounded contextual text snippet")
    score: float = Field(default=0.0, description="Cosine similarity score (0.0 to 1.0)")

class RAGQueryRequest(BaseModel):
    destination: str = Field(..., description="Target destination city or region")
    query: str = Field(..., description="User natural language query or concern")
    top_k: int = Field(default=3, description="Maximum number of relevant chunks to retrieve")

class RAGQueryResponse(BaseModel):
    destination: str
    query: str
    total_found: int
    results: List[RAGChunk]

class RAGDestinationSummary(BaseModel):
    destination: str
    total_chunks: int
    categories: List[str]
    source_file: str

class RAGDestinationsResponse(BaseModel):
    total_destinations: int
    total_chunks: int
    destinations: List[RAGDestinationSummary]
