from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserBase(BaseModel):
    username: str
    full_name: str
    role: str = "user"


class UserCreate(UserBase):
    password: str
    company_id: Optional[int] = None


class UserOut(UserBase):
    """Returned to clients. Notice: hashed_password is NOT included here for security!"""
    id: int
    company_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # Allows converting SQLAlchemy User ORM model to Pydantic JSON