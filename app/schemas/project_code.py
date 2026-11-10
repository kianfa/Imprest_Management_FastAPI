from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# Base shared attributes
class ProjectCodeBase(BaseModel):
    code: str = Field(..., max_length=50, description="Project code (e.g. PRJ-101)")
    name: str = Field(..., max_length=150, description="Project descriptive name")
    description: Optional[str] = Field(None, max_length=255)
    is_active: bool = True


# Schema for creating a project code
class ProjectCodeCreate(ProjectCodeBase):
    pass


# Schema for partial updates
class ProjectCodeUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None


# Schema returned in API responses
class ProjectCodeOut(ProjectCodeBase):
    id: int
    company_id: int
    created_at: datetime

    class Config:
        from_attributes = True