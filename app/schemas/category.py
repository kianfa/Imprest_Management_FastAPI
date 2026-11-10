from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class CategoryBase(BaseModel):
    code: str = Field(..., max_length=50, description= "Category code (e.g. ...)")
    name: str = Field(..., max_length=100, description= "Category name (e.g. transportation)")
    is_active: bool =True


class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None

# Schema returned in API responses
class CategoryOut(CategoryBase):
    id: int
    company_id: int
    created_at: datetime
    class Config:
        from_attributes = True

