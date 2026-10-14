from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.utils.solar_date import validate_jalali_date_str


# 1. Base fields shared across schemas
class RecordBase(BaseModel):
    invoice_no: str = Field(..., min_length=1, max_length=100, description="Unique invoice identifier")
    project_code: str = Field(..., min_length=1, max_length=100, description="Project or cost center code")
    amount: float = Field(..., gt=0, description="Expense amount (must be greater than 0)")
    record_date: str = Field(..., description="Shamsi date in YYYY/MM/DD format (e.g. 1403/07/23)")
    explanation: Optional[str] = Field(None, description="Detailed explanation of the expense")
    expense_center: Optional[str] = Field(None, max_length=100)
    expense_type: Optional[str] = Field(None, max_length=100)
    source_pc: Optional[str] = Field(None, max_length=100)

    # 🛡️ Custom validator for Shamsi date format!
    @field_validator("record_date")
    @classmethod
    def check_valid_jalali_date(cls, v: str) -> str:
        if not validate_jalali_date_str(v):
            raise ValueError("Invalid Jalali date format. Expected 'YYYY/MM/DD' (e.g. 1403/07/23) with valid month and day.")
        return v


# 2. Schema for creating a record
class RecordCreate(RecordBase):
    pass


# 3. Schema for updating a record (all fields are optional)
class RecordUpdate(BaseModel):
    invoice_no: Optional[str] = Field(None, min_length=1, max_length=100)
    project_code: Optional[str] = Field(None, min_length=1, max_length=100)
    amount: Optional[float] = Field(None, gt=0)
    record_date: Optional[str] = None
    explanation: Optional[str] = None
    expense_center: Optional[str] = None
    expense_type: Optional[str] = None

    @field_validator("record_date")
    @classmethod
    def check_valid_jalali_date(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not validate_jalali_date_str(v):
            raise ValueError("Invalid Jalali date format. Expected 'YYYY/MM/DD'.")
        return v


# 4. Schema for returning image attachment details
class RecordImageOut(BaseModel):
    id: int
    file_name: str
    file_path: str  # Public Supabase CDN URL

    class Config:
        from_attributes = True


# 5. Schema returned to the client
class RecordOut(RecordBase):
    id: str
    company_id: int
    created_by_id: int
    created_by_name: str
    deleted: bool
    created_at: datetime
    last_modified: datetime
    images: List[RecordImageOut] = []

    class Config:
        from_attributes = True