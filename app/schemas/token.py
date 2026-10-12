from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    """Returned to the client upon successful login."""
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """The data payload stored inside the decoded JWT token."""
    sub: Optional[str] = None       # Username
    role: Optional[str] = None      # 'super_admin', 'admin', or 'user'
    full_name: Optional[str] = None