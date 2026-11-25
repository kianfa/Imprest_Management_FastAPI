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

# 3. UPDATE USER / RESET PASSWORD (Admin Only)
@router.put("/{user_id}", response_model=UserOut)
def update_company_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_admin),
):
    """
    Update employee profile, change role, or reset password.
    Enforces multi-tenancy and self-lockout prevention.
    """
    # 🔒 1. Multi-Tenant Safe Lookup
    user = db.query(User).filter(
        User.id == user_id,
        User.company_id == current_admin.company_id,
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User ID '{user_id}' not found in your company."
        )

    # 🔒 2. Prevent Self-Lockout
    if current_admin.id == user.id:
        if payload.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate your own admin account."
            )
        if payload.role and payload.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot demote yourself from the admin role."
            )

    # 🔒 3. Prevent Privilege Escalation
    if payload.role and payload.role not in ["user", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only assign 'user' or 'admin' roles."
        )

    update_data = payload.model_dump(exclude_unset=True)

    # 🔒 4. Handle Password Reset
    if "password" in update_data:
        raw_password = update_data.pop("password")
        user.hashed_password = get_password_hash(raw_password)

    # 5. Apply remaining profile updates (full_name, role, is_active)
    for field, value in update_data.items():
        setattr(user, field, value.strip() if isinstance(value, str) else value)

    db.commit()
    db.refresh(user)
    return user


# 4. DELETE / DEACTIVATE USER (Admin Only - Audit Safe)
@router.delete("/{user_id}")
def delete_company_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_admin),
):
    """
    Deactivates or deletes an employee.
    If the user has historical receipts, they are deactivated to preserve financial audit trails.
    """
    user = db.query(User).filter(
        User.id == user_id,
        User.company_id == current_admin.company_id,
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User ID '{user_id}' not found in your company."
        )

    # 🔒 1. Cannot delete self
    if current_admin.id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account."
        )

    # 🛡️ 2. Check for Historical Expense Records
    has_records = db.query(ExpenseRecord).filter(
        ExpenseRecord.created_by_id == user.id,
        ExpenseRecord.company_id == current_admin.company_id,
    ).first()

    if has_records:
        # User has receipts -> Preserve audit trail, DEACTIVATE only
        user.is_active = False
        db.commit()
        return {
            "detail": f"User '{user.username}' has historical expense records and was deactivated instead of deleted to protect the audit trail."
        }

    # User has zero receipts -> Safe to hard delete
    db.delete(user)
    db.commit()
    return {"detail": f"User '{user.username}' deleted successfully."}