from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.expense_center import ExpenseCenter
from app.models.record import ExpenseRecord
from app.schemas.expense_center import (
    ExpenseCenterCreate,
    ExpenseCenterUpdate,
    ExpenseCenterOut,
)

router = APIRouter()



@router.get("/", response_model=List[ExpenseCenterOut])
def get_expense_centers(
    is_active: Optional[bool] = Query(None, description="Filter by active status (e.g. true for dropdowns)"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    List all Expense Centers for the current user's company.
    Regular users call this with `?is_active=true` to populate dropdown lists.
    """
    query = db.query(ExpenseCenter).filter(ExpenseCenter.company_id == current_user.company_id)

    if is_active is not None:
        query = query.filter(ExpenseCenter.is_active == is_active)

    return query.order_by(ExpenseCenter.code.asc()).all()
