from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core.security import verify_password, create_access_token
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserOut

router = APIRouter()


@router.post("/login", response_model=Token)
def login(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login.
    Takes 'username' and 'password' from form data,
    verifies them against the database, and returns a JWT access token.
    """
    # 1. Look up the user in PostgreSQL
    user = db.query(User).filter(User.username == form_data.username).first()

    # 2. Check if user exists AND if password hash matches
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )

    # 4. Generate the signed JWT token string
    access_token = create_access_token(
        subject=user.username,
        role=user.role,
        full_name=user.full_name
    )

    # 5. Return conforming to Token schema (Token: access_token, token_type="bearer")
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def read_current_user_profile(
    current_user: User = Depends(deps.get_current_user)
):
    """
    Protected endpoint: returns the authenticated user's profile.
    Notice how clean this is thanks to deps.get_current_user!
    """
    return current_user