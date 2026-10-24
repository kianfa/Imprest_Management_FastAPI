from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.record import ExpenseRecord, RecordImage
from app.schemas.record import RecordOut, RecordCreate
from app.services.storage_services import process_and_upload_image
from app.utils.solar_date import validate_jalali_date_str
router = APIRouter()


@router.post("/", response_model=RecordOut, status_code=status.HTTP_201_CREATED)
def create_expense_record(
    invoice_no: str = Form(..., description="Invoice Number"),
    project_code: str = Form(..., description="Project Code"),
    amount: float = Form(..., gt=0, description="Expense Amount"),
    record_date: str = Form(..., description="Shamsi Date (YYYY/MM/DD)"),
    explanation: Optional[str] = Form(None),
    expense_center: Optional[str] = Form(None),
    expense_type: Optional[str] = Form(None),
    source_pc: Optional[str] = Form(None),
    images: Optional[List[UploadFile]] = File(None, description="Receipt images (optional)"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Creates a new expense record with optional receipt image attachments.
    Automatically ties the record to the current user's company (Multi-tenancy).
    """
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to a company to create expense records."
        )

    # 1. Validate Shamsi Date
    if not validate_jalali_date_str(record_date):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Shamsi date format. Expected 'YYYY/MM/DD' (e.g. 1403/08/03)."
        )

    # 2. Check for duplicate invoice number within the same company
    existing = db.query(ExpenseRecord).filter(
        ExpenseRecord.company_id == current_user.company_id,
        ExpenseRecord.invoice_no == invoice_no,
        ExpenseRecord.deleted == False
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invoice number '{invoice_no}' already exists in your company."
        )

    # 3. Create the Record in PostgreSQL
    new_record = ExpenseRecord(
        company_id=current_user.company_id,
        invoice_no=invoice_no,
        project_code=project_code,
        amount=amount,
        record_date=record_date,
        explanation=explanation,
        expense_center=expense_center,
        expense_type=expense_type,
        source_pc=source_pc,
        created_by_id=current_user.id,
        created_by_name=current_user.full_name,
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    # 4. Upload attached images to Supabase Storage
    if images:
        for idx, file in enumerate(images, start=1):
            if not file or not file.filename:
                continue

            file_name, public_url = process_and_upload_image(
                record_id=new_record.id,
                file=file,
                index=idx
            )

            img_entry = RecordImage(
                record_id=new_record.id,
                file_name=file_name,
                file_path=public_url
            )
            db.add(img_entry)

        db.commit()
        db.refresh(new_record)

    return new_record


@router.get("/", response_model=List[RecordOut])
def list_expense_records(
    invoice_no: Optional[str] = Query(None, description="Search by invoice number (partial)"),
    project_code: Optional[str] = Query(None, description="Search by project code"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY/MM/DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY/MM/DD)"),
    skip: int = Query(0, ge=0, description="Pagination skip offset"),
    limit: int = Query(50, ge=1, le=100, description="Pagination limit"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Lists expense records for the authenticated user's company.
    Supports filtering by invoice number, project code, and date ranges.
    """
    query = db.query(ExpenseRecord).filter(
        ExpenseRecord.company_id == current_user.company_id,
        ExpenseRecord.deleted == False
    )

    if invoice_no:
        query = query.filter(ExpenseRecord.invoice_no.ilike(f"%{invoice_no}%"))
    if project_code:
        query = query.filter(ExpenseRecord.project_code.ilike(f"%{project_code}%"))
    if start_date:
        query = query.filter(ExpenseRecord.record_date >= start_date)
    if end_date:
        query = query.filter(ExpenseRecord.record_date <= end_date)

    return query.order_by(ExpenseRecord.created_at.desc()).offset(skip).limit(limit).all()


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense_record(
    record_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Soft-deletes a record.
    Permission Rule: Admins can delete any company record. Users can only delete their own!
    """
    record = db.query(ExpenseRecord).filter(
        ExpenseRecord.id == record_id,
        ExpenseRecord.company_id == current_user.company_id,
        ExpenseRecord.deleted == False
    ).first()

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    # Enforce Role-Based Permission
    if current_user.role != "admin" and record.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own records."
        )

    record.deleted = True
    db.commit()
    return None