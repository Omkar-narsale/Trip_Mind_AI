import os
from typing import Optional
from langchain_groq import ChatGroq
from app.config import settings

class LLMService:
    _instance: Optional[ChatGroq] = None

    @classmethod
    def get_llm(cls) -> ChatGroq:
        """
        Returns a cached, reusable ChatGroq instance.
        Raises ValueError if GROQ_API_KEY is not configured.
        """
        if cls._instance is not None:
            return cls._instance

        api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
        if not api_key or api_key.strip() in ["", "your_groq_api_key_here"]:
            raise ValueError(
                "GROQ_API_KEY is missing or not configured in backend/.env. "
                "Please add a valid Groq API key to enable AI Trip Goal Analysis."
            )

        model_name = settings.GROQ_MODEL or "llama-3.3-70b-versatile"

        cls._instance = ChatGroq(
            api_key=api_key.strip(),
            model_name=model_name,
            temperature=0.2,
            max_retries=2
        )
        return cls._instance

    @classmethod
    def reset_instance(cls):
        """Allows resetting instance for test suites or config updates."""
        cls._instance = None

def get_llm() -> ChatGroq:
    return LLMService.get_llm()
