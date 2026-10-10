from sqlalchemy.orm import Session
from app.models.company import Company
from app.models.user import User
from app.core.security import get_password_hash


def init_db(db: Session) -> None:
    """Creates default Company and Users if they don't exist."""

    # 1. Seed Default Company
    company = db.query(Company).filter(Company.name == "Main Company").first()
    if not company:
        company = Company(name="Main Company", code="MAIN")
        db.add(company)
        db.commit()
        db.refresh(company)
        print("🏢 Created Default Company: Main Company")

    # 2. Seed Default Users
    default_users = [
        ("farooghi", "1234asd1234", "admin", "Kian Farooghi (Admin)", company.id),
    ]

    for username, plain_pw, role, full_name, comp_id in default_users:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            user = User(
                username=username,
                hashed_password=get_password_hash(plain_pw),
                role=role,
                full_name=full_name,
                company_id=comp_id
            )
            db.add(user)
            print(f"👤 Created User: {username} ({role})")

    db.commit()