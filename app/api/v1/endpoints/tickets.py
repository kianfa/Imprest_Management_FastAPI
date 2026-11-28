from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.record import ExpenseRecord
from app.models.ticket import RecordTicket
from app.models.user import User
from app.schemas.ticket import TicketCreate, TicketOut

router = APIRouter()


@router.post(
    "/{record_id}/tickets",
    response_model=TicketOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a problem ticket on a record (Admin only)"
)
def create_record_ticket(
    record_id: str,
    payload: TicketCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_admin),
):
    """
    Attaches a problem note/ticket to an expense record.
    Restricted to Admins within the same company.
    """
    # 1. Verify the record exists, is not deleted, and belongs to the current user's company
    record = (
        db.query(ExpenseRecord)
        .filter(
            ExpenseRecord.id == record_id,
            ExpenseRecord.company_id == current_user.company_id,
            ExpenseRecord.deleted == False,
        )
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found in your company",
        )

    # 2. Create the ticket
    ticket = RecordTicket(
        record_id=record_id,
        company_id=current_user.company_id,
        created_by_id=current_user.id,
        message=payload.message.strip(),
        status="OPEN",
        created_at=datetime.utcnow(),
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get(
    "/{record_id}/tickets",
    response_model=List[TicketOut],
    summary="List all tickets for an expense record"
)
def get_record_tickets(
    record_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Returns all tickets for a specific record in descending chronological order.
    Accessible to all active company members.
    """
    # 1. Verify record belongs to company
    record = (
        db.query(ExpenseRecord)
        .filter(
            ExpenseRecord.id == record_id,
            ExpenseRecord.company_id == current_user.company_id,
            ExpenseRecord.deleted == False,
        )
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found in your company",
        )

    # 2. Fetch tickets
    tickets = (
        db.query(RecordTicket)
        .filter(
            RecordTicket.record_id == record_id,
            RecordTicket.company_id == current_user.company_id,
        )
        .order_by(RecordTicket.created_at.desc())
        .all()
    )
    return tickets


@router.patch(
    "/{record_id}/tickets/{ticket_id}/resolve",
    response_model=TicketOut,
    summary="Mark a ticket as resolved"
)
def resolve_ticket(
    record_id: str,
    ticket_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Marks an OPEN ticket as RESOLVED.
    """
    ticket = (
        db.query(RecordTicket)
        .filter(
            RecordTicket.id == ticket_id,
            RecordTicket.record_id == record_id,
            RecordTicket.company_id == current_user.company_id,
        )
        .first()
    )
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    if ticket.status != "RESOLVED":
        ticket.status = "RESOLVED"
        ticket.resolved_at = datetime.utcnow()
        db.commit()
        db.refresh(ticket)

    return ticket