from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.core.security import get_password_hash
from app.models.user import User
from app.models.record import ExpenseRecord
from app.schemas.user import UserCreate, UserUpdate, UserOut

router = APIRouter()

# 1. LIST USERS (Admin Only)
@router.get("/", response_model=List[UserOut])
def get_company_users(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_admin),
):
    """
    List all employees/users belonging to the current admin's company.
    """
    query = db.query(User).filter(User.company_id == current_admin.company_id)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    return query.order_by(User.id.asc()).all()

# 2. CREATE USER (Admin Only - Temporary Direct Provisioning)
@router.post(
    "/",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create User Directly (Temporary Provisioning)",
    deprecated=True,
)
def create_company_user(
    payload: UserCreate,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_admin),
):
    """
    Creates a new user directly with a temporary password.

    > ⚠️ **SECURITY & DEPRECATION NOTICE:**
    > This direct password provisioning endpoint is temporary for initial system setup.
    > It will be **eliminated** once the Zoho Mail invitation flow is implemented.
    > In production, admins should never define user passwords directly.
    """
    # TODO(KF): Replace this direct creation method with Zoho Mail invitation workflow.

    # 1. Privilege Escalation Check
    if payload.role not in ["user", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only assign 'user' or 'admin' roles."
        )

    # 2. Username Check
    existing_user = db.query(User).filter(User.username == payload.username.strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{payload.username}' is already taken."
        )

    # 3. Create User with Hashed Password
    new_user = User(
        username=payload.username.strip(),
        full_name=payload.full_name.strip(),
        role=payload.role,
        hashed_password=get_password_hash(payload.password),
        company_id=current_admin.company_id,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user