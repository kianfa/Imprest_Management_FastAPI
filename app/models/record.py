import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base


class ExpenseRecord(Base):
    __tablename__ = "records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # 🏢 Direct company link for fast multi-tenant filtering & security isolation
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)

    invoice_no = Column(String(100), index=True, nullable=False)
    project_code = Column(String(100), index=True, nullable=False)
    explanation = Column(Text, nullable=True)
    amount = Column(Float, nullable=False)
    record_date = Column(String(10), index=True, nullable=False)  # Shamsi "1403/06/22"
    source_pc = Column(String(100), nullable=True)
    expense_center = Column(String(100), nullable=True)
    expense_type = Column(String(100), nullable=True)

    # Soft delete
    deleted = Column(Boolean, default=False, nullable=False)

    # User who created it
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_by_name = Column(String(100), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    last_modified = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="records")
    creator = relationship("User", back_populates="records")
    images = relationship("RecordImage", back_populates="record", cascade="all, delete-orphan")


class RecordImage(Base):
    __tablename__ = "record_images"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(36), ForeignKey("records.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(500), nullable=False)  # Supabase Storage URL
    file_name = Column(String(255), nullable=False)

    record = relationship("ExpenseRecord", back_populates="images")