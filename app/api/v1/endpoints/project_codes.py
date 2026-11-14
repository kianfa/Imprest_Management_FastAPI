from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.project_code import ProjectCode
from app.models.record import ExpenseRecord
from app.schemas.project_code import (
    ProjectCodeCreate,
    ProjectCodeUpdate,
    ProjectCodeOut,
)

router = APIRouter()


# 1. LIST PROJECT CODES (All Authenticated Users)
@router.get("/", response_model=List[ProjectCodeOut])
def get_project_codes(
    is_active: Optional[bool] = Query(None, description="Filter by active status (e.g. true for dropdowns)"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    List all project codes for the current user's company.
    Regular users call this with `?is_active=true` to populate dropdown lists.
    """
    query = db.query(ProjectCode).filter(ProjectCode.company_id == current_user.company_id)

    if is_active is not None:
        query = query.filter(ProjectCode.is_active == is_active)

    return query.order_by(ProjectCode.code.asc()).all()


# 2. CREATE PROJECT CODE (Admin Only)
@router.post("/", response_model=ProjectCodeOut, status_code=status.HTTP_201_CREATED)
def create_project_code(
    payload: ProjectCodeCreate,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_admin),
):
    """
    Creates a new project code for the admin's company.
    Enforces uniqueness per company.
    """
    # Check for duplicate code within the same company
    existing = db.query(ProjectCode).filter(
        ProjectCode.company_id == current_admin.company_id,
        ProjectCode.code == payload.code.strip(),
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project code '{payload.code}' already exists in your company."
        )

    new_project = ProjectCode(
        company_id=current_admin.company_id,
        code=payload.code.strip(),
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        is_active=payload.is_active,
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


# 3. UPDATE PROJECT CODE (Admin Only)
@router.put("/{project_id}", response_model=ProjectCodeOut)
def update_project_code(
    project_id: int,
    payload: ProjectCodeUpdate,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_admin),
):
    """
    Updates an existing project code.
    Allows partial updates (e.g., deactivating or renaming).
    """
    project = db.query(ProjectCode).filter(
        ProjectCode.id == project_id,
        ProjectCode.company_id == current_admin.company_id,
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project code not found."
        )

    update_data = payload.model_dump(exclude_unset=True)

    # If code is being changed, check that new code is not taken
    if "code" in update_data and update_data["code"] != project.code:
        duplicate = db.query(ProjectCode).filter(
            ProjectCode.company_id == current_admin.company_id,
            ProjectCode.code == update_data["code"].strip(),
            ProjectCode.id != project.id,
        ).first()

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Project code '{update_data['code']}' is already in use."
            )

    for field, value in update_data.items():
        setattr(project, field, value.strip() if isinstance(value, str) else value)

    db.commit()
    db.refresh(project)
    return project


# 4. DELETE PROJECT CODE (Admin Only - Defensive)
@router.delete("/{project_id}")
def delete_project_code(
    project_id: int,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_admin),
):
    """
    Deletes a project code.
    Blocks deletion if any existing ExpenseRecord is using this code.
    """
    project = db.query(ProjectCode).filter(
        ProjectCode.id == project_id,
        ProjectCode.company_id == current_admin.company_id,
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project code not found."
        )

    #  DEFENSIVE INTEGRITY CHECK:
    # Does any active expense record use this project code?
    record_using_code = db.query(ExpenseRecord).filter(
        ExpenseRecord.company_id == current_admin.company_id,
        ExpenseRecord.project_code == project.code,
        ExpenseRecord.deleted == False,
    ).first()

    if record_using_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete this project code because it is used in existing expense records. Please deactivate it instead."
        )

    db.delete(project)
    db.commit()
    return {"detail": f"Project code '{project.code}' deleted successfully."}