from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api_router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from web, desktop, and mobile
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API v1 routes under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def health_check():
    """Simple health check endpoint to verify server is running."""
    return {"status": "ok", "project": settings.PROJECT_NAME}