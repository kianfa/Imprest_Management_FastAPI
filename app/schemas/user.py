from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    full_name: str = Field(..., min_length=2, max_length=100, description="Full real name")
    role: str = Field("user", description="Role: 'admin' or 'user'")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Plain text password (will be hashed)")


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[str] = Field(None, description="'admin' or 'user'")
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, description="New password if resetting")


class UserOut(UserBase):
    """Returned to clients. Notice: hashed_password is NOT included here for security!"""
    id: int
    company_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True