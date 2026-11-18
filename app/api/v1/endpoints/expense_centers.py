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
@router.post("/", response_model=ExpenseCenterOut, status_code=status.HTTP_201_CREATED)
def create_expense_center(
        payload: ExpenseCenterCreate,
        db: Session = Depends(deps.get_db),
        current_admin: User = Depends(deps.require_admin),
):
    """
    Creates a new expense_center for the admin's company.
    Enforces uniqueness per company.
    """
    existing = db.query(ExpenseCenter).filter(
        ExpenseCenter.company_id == current_admin.company_id,
        ExpenseCenter.code == payload.code.strip(),
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"ExpenseCenter code '{payload.code}' already exists in your company."
        )

    new_expense_center = ExpenseCenter(
        company_id=current_admin.company_id,
        code=payload.code.strip(),
        name=payload.name.strip(),
        is_active=payload.is_active,
    )

    db.add(new_expense_center)
    db.commit()
    db.refresh(new_expense_center)
    return new_expense_center

@router.put("/{expense_center_id}", response_model=ExpenseCenterOut)
def update_expense_center(
    expense_center_id: int,
    payload: ExpenseCenterUpdate,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_admin),
):
    expense_center = db.query(ExpenseCenter).filter(
        ExpenseCenter.id == expense_center_id,
        ExpenseCenter.company_id == current_admin.company_id,
    ).first()

    if not expense_center:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense center ID '{expense_center_id}' not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    # If code is being changed, check that new code is not taken in THIS company
    if "code" in update_data and update_data["code"] != expense_center.code:
        duplicate = db.query(ExpenseCenter).filter(
            ExpenseCenter.company_id == current_admin.company_id,
            ExpenseCenter.code == update_data["code"].strip(),
            ExpenseCenter.id != expense_center.id,
        ).first()

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Expense center code '{update_data['code']}' is already in use."
            )

    for field, value in update_data.items():
        setattr(expense_center, field, value.strip() if isinstance(value, str) else value)

    db.commit()
    db.refresh(expense_center)
    return expense_center

@router.delete("/{expense_center_id}")
def delete_expense_center(
        expense_center_id: int,
        db: Session = Depends(deps.get_db),
        current_admin: User = Depends(deps.require_admin),
):

    """
    Deletes a expense_center.
    Blocks deletion if any existing ExpenseRecord is using this code.
    """
    expense_center = db.query(ExpenseCenter).filter(
        ExpenseCenter.id == expense_center_id,
        ExpenseCenter.company_id == current_admin.company_id,
    ).first()
    if not expense_center:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense center not found."
        )
    record_using_code = db.query(ExpenseRecord).filter(
        ExpenseRecord.company_id == current_admin.company_id,
        ExpenseRecord.expense_center == expense_center.name,
        ExpenseRecord.deleted == False,
    ).first()

    if record_using_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete this expense center because it is used in existing expense records. Please deactivate it instead."
        )
    db.delete(expense_center)
    db.commit()
    return {"detail": f"Expence center '{expense_center.name}' deleted successfully."}