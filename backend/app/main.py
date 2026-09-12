from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import router as api_router

from contextlib import asynccontextmanager
import logging
from app.services.supabase_service import supabase_service

logger = logging.getLogger("uvicorn.info")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Log Supabase configuration status cleanly at startup
    is_conf = supabase_service.is_configured()
    logger.info("Supabase configured: %s", "true" if is_conf else "false")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="TripMind AI - Autonomous Travel Planning and Booking Assistant API",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix="")

@app.get("/", tags=["Health Check"])
async def root():
    return {"message": "TripMind AI Backend Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
