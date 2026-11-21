from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    records,
    project_codes,
    expense_centers,
    categories,
)

api_router = APIRouter()

# 1. Authentication (/api/v1/auth)
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# 2. Expense Records (/api/v1/records)
api_router.include_router(records.router, prefix="/records", tags=["Expense Records"])

# 3. Master Lookups
api_router.include_router(project_codes.router, prefix="/project-codes", tags=["Project Codes"])
api_router.include_router(expense_centers.router, prefix="/expense-centers", tags=["Expense Centers"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])