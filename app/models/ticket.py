from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base


class RecordTicket(Base):
    __tablename__ = "record_tickets"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign key to records.id (String(36) UUID)
    record_id = Column(String(36), ForeignKey("records.id", ondelete="CASCADE"), nullable=False, index=True)

    # Multi-tenant company isolation
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)

    # User who created the ticket (Admin / Manager)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Ticket content & lifecycle
    message = Column(Text, nullable=False)
    status = Column(String(20), default="OPEN", nullable=False)  # 'OPEN' | 'RESOLVED'

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    record = relationship("ExpenseRecord", back_populates="tickets")
    created_by = relationship("User")