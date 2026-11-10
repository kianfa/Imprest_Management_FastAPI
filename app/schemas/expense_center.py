from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ExpenseCenterBase(BaseModel):
    code: str = Field(..., max_length=50, description= "expense center code (e.g ...)")
    name: str = Field(..., max_length=150, description= "expense center name (e.g ...)")
    is_active: bool = True

class ExpenseCenterCreate(ExpenseCenterBase):
    pass

class ExpenseCenterUpdate(BaseModel):
    code: Optional[str]= Field(None, max_length=50)
    name: Optional[str]= Field(None, max_length=150)
    is_active: Optional[bool] = None

class ExpenseCenterOut(ExpenseCenterBase):
    id: int
    company_id: int
    created_at: datetime

    class Config:
        from_attributes = True




