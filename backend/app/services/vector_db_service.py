import os
import re
import json
import logging
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.schemas.rag import RAGChunk, RAGQueryResponse, RAGDestinationSummary, RAGDestinationsResponse

logger = logging.getLogger(__name__)

class VectorDBService:
    def __init__(self, data_dir: Optional[str] = None, storage_dir: Optional[str] = None):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.data_dir = data_dir or os.path.join(base_dir, "data", "knowledge_base")
        self.storage_dir = storage_dir or os.path.join(base_dir, "data", "vector_store")
        os.makedirs(self.storage_dir, exist_ok=True)

        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            stop_words="english",
            max_features=5000
        )
        self.chunks: List[Dict[str, Any]] = []
        self.doc_vectors: Optional[np.ndarray] = None
        self._is_indexed = False

        self.initialize_index()

    def _clean_text(self, text: str) -> str:
        return re.sub(r"\s+", " ", text).strip()

    def _determine_category(self, title: str, text: str) -> str:
        combined = (title + " " + text).lower()
        if any(w in combined for w in ["safety", "emergency", "police", "ambulance", "scam", "hospital", "lifeguard"]):
            return "safety"
        elif any(w in combined for w in ["transit", "metro", "bus", "taxi", "scooter", "train", "flight", "subway", "mobility"]):
            return "transit"
        elif any(w in combined for w in ["visa", "entry", "passport", "permit", "customs", "immigration", "pass"]):
            return "visa"
        elif any(w in combined for w in ["etiquette", "culture", "respect", "temple", "tipping", "decorum", "dress code", "alcohol"]):
            return "culture"
        return "general"

    def parse_markdown_document(self, file_path: str) -> List[Dict[str, Any]]:
        filename = os.path.basename(file_path)
        dest_key = filename.replace(".md", "").lower()
        chunks = []

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            sections = re.split(r"\n##\s+", content)
            main_title = "General Information"
            if len(sections) > 0 and sections[0].startswith("# "):
                first_lines = sections[0].split("\n")
                main_title = first_lines[0].replace("# ", "").strip()
                intro = "\n".join(first_lines[1:]).strip()
                if intro:
                    chunks.append({
                        "chunk_id": f"{dest_key}_intro",
                        "destination": dest_key,
                        "category": "general",
                        "title": main_title,
                        "text": self._clean_text(intro)
                    })
                sections = sections[1:]

            for idx, sec in enumerate(sections):
                lines = sec.split("\n", 1)
                sec_title = lines[0].strip()
                sec_body = lines[1].strip() if len(lines) > 1 else ""
                if not sec_body:
                    continue

                category = self._determine_category(sec_title, sec_body)
                
                # Split large sections into sub-bullets if long
                bullets = [b.strip() for b in sec_body.split("\n- ") if b.strip()]
                if len(bullets) > 1 and len(sec_body) > 300:
                    for b_idx, bullet in enumerate(bullets):
                        b_text = bullet if bullet.startswith("- ") else f"- {bullet}"
                        chunks.append({
                            "chunk_id": f"{dest_key}_{idx}_{b_idx}",
                            "destination": dest_key,
                            "category": category,
                            "title": f"{sec_title} - Item {b_idx + 1}",
                            "text": self._clean_text(b_text)
                        })
                else:
                    chunks.append({
                        "chunk_id": f"{dest_key}_{idx}",
                        "destination": dest_key,
                        "category": category,
                        "title": sec_title,
                        "text": self._clean_text(sec_body)
                    })

        except Exception as e:
            logger.error(f"Error parsing knowledge base file {file_path}: {e}")

        return chunks

    def initialize_index(self):
        """Scans the knowledge base directory, generates embeddings, and saves the vector store."""
        if not os.path.exists(self.data_dir):
            logger.warning(f"Knowledge base data directory not found at {self.data_dir}")
            return

        all_chunks = []
        for file in os.listdir(self.data_dir):
            if file.endswith(".md"):
                full_path = os.path.join(self.data_dir, file)
                all_chunks.extend(self.parse_markdown_document(full_path))

        if not all_chunks:
            logger.warning("No knowledge chunks discovered for indexing.")
            return

        corpus = [f"{c['title']}. {c['text']}" for c in all_chunks]
        self.doc_vectors = self.vectorizer.fit_transform(corpus)
        self.chunks = all_chunks
        self._is_indexed = True

        # Persist index manifest to disk
        manifest_path = os.path.join(self.storage_dir, "index_manifest.json")
        try:
            with open(manifest_path, "w", encoding="utf-8") as f:
                json.dump({
                    "total_chunks": len(self.chunks),
                    "destinations": list({c["destination"] for c in self.chunks}),
                    "chunks": self.chunks
                }, f, indent=2)
            logger.info(f"Vector Database indexed {len(self.chunks)} chunks across {len(set(c['destination'] for c in self.chunks))} destinations.")
        except Exception as err:
            logger.warning(f"Could not persist vector manifest: {err}")

    def query(self, destination: str, query_text: str, top_k: int = 3) -> List[RAGChunk]:
        """Calculates cosine similarity and returns top-k grounded chunks."""
        if not self._is_indexed or self.doc_vectors is None or len(self.chunks) == 0:
            self.initialize_index()
            if not self._is_indexed or self.doc_vectors is None:
                return []

        dest_norm = destination.strip().lower()
        
        # Transform query into embedding vector
        query_vec = self.vectorizer.transform([query_text])
        similarities = cosine_similarity(query_vec, self.doc_vectors)[0]

        scored_chunks = []
        for idx, score in enumerate(similarities):
            chunk = self.chunks[idx]
            # Match destination (exact match or query includes destination)
            is_dest_match = (
                chunk["destination"] == dest_norm or
                dest_norm in chunk["destination"] or
                chunk["destination"] in dest_norm
            )
            
            # Boost score if destination matches directly
            adjusted_score = float(score) * (1.5 if is_dest_match else 0.5)

            if is_dest_match or score > 0.08:
                scored_chunks.append((adjusted_score, float(score), chunk))

        # Sort descending by adjusted score
        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        results: List[RAGChunk] = []
        for adj_score, orig_score, c in scored_chunks[:top_k]:
            results.append(RAGChunk(
                chunk_id=c["chunk_id"],
                destination=c["destination"],
                category=c["category"],
                title=c["title"],
                text=c["text"],
                score=round(float(max(orig_score, adj_score / 1.5)), 4)
            ))

        return results

    def get_indexed_destinations(self) -> RAGDestinationsResponse:
        dest_map: Dict[str, Dict[str, Any]] = {}
        for c in self.chunks:
            d = c["destination"]
            if d not in dest_map:
                dest_map[d] = {
                    "destination": d,
                    "total_chunks": 0,
                    "categories": set(),
                    "source_file": f"{d}.md"
                }
            dest_map[d]["total_chunks"] += 1
            dest_map[d]["categories"].add(c["category"])

        summaries = [
            RAGDestinationSummary(
                destination=info["destination"],
                total_chunks=info["total_chunks"],
                categories=sorted(list(info["categories"])),
                source_file=info["source_file"]
            )
            for info in dest_map.values()
        ]

        return RAGDestinationsResponse(
            total_destinations=len(summaries),
            total_chunks=len(self.chunks),
            destinations=summaries
        )

vector_db_service = VectorDBService()
