from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# Setup password hashing with Bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compares a plain text password (from login form) with the hashed password in DB.
    Returns True if they match, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Generates a secure bcrypt hash of a plain text password.
    Example: 'admin123' -> '$2b$12$e8V...'
    """
    return pwd_context.hash(password)


def create_access_token(
    subject: Union[str, Any],
    role: str,
    full_name: str,
    expires_delta: timedelta = None
) -> str:
    """
    Creates a signed JWT token containing username ('sub'), role, and full name.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "exp": expire,             # Expiration timestamp
        "sub": str(subject),       # Username
        "role": role,               # Role ('super_admin', 'admin', or 'user')
        "full_name": full_name      # User display name
    }

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)