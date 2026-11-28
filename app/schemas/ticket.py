from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserOut


class TicketBase(BaseModel):
    message: str = Field(..., min_length=2, max_length=1000, description="Description of the issue with this record")


class TicketCreate(TicketBase):
    pass


class TicketOut(TicketBase):
    id: int
    record_id: str
    company_id: int
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    created_by: UserOut

    class Config:
        from_attributes = True