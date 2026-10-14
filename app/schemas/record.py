from datetime import datetime
from typing import Optional, List, Annotated
from pydantic import BaseModel, Field, AfterValidator, field_validator
from app.utils.solar_date import validate_jalali_date_str


def check_jalali(v: str) -> str:
    if not validate_jalali_date_str(v):
        raise ValueError("Invalid Jalali date format. Expected 'YYYY/MM/DD' (e.g. 1403/07/23).")
    return v


# Single Reusable Custom Type
JalaliDateStr = Annotated[str, AfterValidator(check_jalali)]


#  Base fields shared across schemas
class RecordBase(BaseModel):
    invoice_no: str = Field(..., min_length=1, max_length=100, description="Unique invoice identifier")
    project_code: str = Field(..., min_length=1, max_length=100, description="Project or cost center code")
    amount: float = Field(..., gt=0, description="Expense amount (must be greater than 0)")
    record_date: JalaliDateStr = Field(..., description="Shamsi date in YYYY/MM/DD format (e.g. 1403/07/23)")
    explanation: Optional[str] = Field(None, description="Detailed explanation of the expense")
    expense_center: Optional[str] = Field(None, max_length=100)
    expense_type: Optional[str] = Field(None, max_length=100)
    source_pc: Optional[str] = Field(None, max_length=100)


#Schema for creating a record
class RecordCreate(RecordBase):
    pass


# Schema for updating a record (all fields are optional)
class RecordUpdate(BaseModel):
    invoice_no: Optional[str] = Field(None, min_length=1, max_length=100)
    project_code: Optional[str] = Field(None, min_length=1, max_length=100)
    amount: Optional[float] = Field(None, gt=0)
    record_date: Optional[JalaliDateStr] = None
    explanation: Optional[str] = None
    expense_center: Optional[str] = None
    expense_type: Optional[str] = None


# Schema for image attachment details
class RecordImageOut(BaseModel):
    id: int
    file_name: str
    file_path: str

    class Config:
        from_attributes = True


# Schema returned to the client
class RecordOut(RecordBase):
    id: str
    company_id: int
    created_by_id: int
    created_by_name: str
    deleted: bool
    created_at: datetime
    last_modified: datetime
    images: List[RecordImageOut] = None

    class Config:
        from_attributes = True