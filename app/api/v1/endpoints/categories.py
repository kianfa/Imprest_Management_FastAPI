from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.category import Category
from app.models.record import ExpenseRecord
from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryOut,
)
router = APIRouter()

# 1. LIST Categories (All Authenticated Users)
@router.get("/", response_model=List[CategoryOut])
def get_categories(
        is_active: Optional[bool] = Query(None, description="Filter by active status (e.g. true for dropdowns)"),
        db: Session = Depends(deps.get_db),
        current_user: User = Depends(deps.get_current_user)
):
    """
    List all categories for the current user's company.
    Regular users call this with `?is_active=true` to populate dropdown lists.
    """
    query = db.query(Category).filter(Category.company_id == current_user.company_id)

    if is_active is not None:
        query = query.filter(Category.is_active == is_active)

    return query.order_by(Category.code.asc()).all()

# 2. CREATE Category (Admin Only)
@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
        payload: CategoryCreate,
        db: Session = Depends(deps.get_db),
        current_admin: User = Depends(deps.require_admin),
):
    """
    Creates a new category for the admin's company.
    Enforces uniqueness per company.
    """
    existing = db.query(Category).filter(
        Category.company_id == current_admin.company_id,
        Category.name == payload.name.strip(),
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"category code '{payload.code}' already exists in your company."
        )

    new_category = Category(
        company_id=current_admin.company_id,
        code=payload.code.strip() if payload.code else None,
        is_active=payload.is_active,
    )
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_admin),
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.company_id == current_admin.company_id,
    ).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"category ID '{category_id}' not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    # If code is being changed, check that new code is not taken in THIS company
    if "name" in update_data and update_data["name"] != category.name:
        duplicate = db.query(Category).filter(
            Category.company_id == current_admin.company_id,
            Category.code == update_data["name"].strip(),
            Category.id != category.id,
        ).first()

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"category name: '{update_data['name']}' is already in use."
            )

    for field, value in update_data.items():
        setattr(Category, field, value.strip() if isinstance(value, str) else value)

    db.commit()
    db.refresh(Category)
    return Category

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_admin),
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.company_id == current_admin.company_id,
    ).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found."
        )
    # 🛡️ Defensive Check: Is this category name referenced in active receipts?
    record_using_category = db.query(ExpenseRecord).filter(
        ExpenseRecord.company_id == current_admin.company_id,
        ExpenseRecord.expense_type == category.name,
        ExpenseRecord.deleted == False,
    ).first()
    if record_using_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category '{category.name}' because it is used in existing expense records. Please deactivate it instead."
        )
    db.delete(category)
    db.commit()
    return {"detail": f"Category '{category.name}' deleted successfully."}