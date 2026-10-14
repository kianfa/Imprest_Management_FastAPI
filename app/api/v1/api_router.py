from fastapi import APIRouter
from app.api.v1.endpoints import auth, records

api_router = APIRouter()

# Mount auth endpoints under /auth with the tag "Authentication"
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])


# 2. Expense Records endpoints (/api/v1/records)
api_router.include_router(records.router, prefix="/records", tags=["Expense Records"])