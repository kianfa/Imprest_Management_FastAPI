import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.api import deps
from app.db.session import Base
from app.core.security import get_password_hash
from app.models import Company, User


# 1. Isolated in-memory SQLite engine for fast testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# 2. Fresh database tables before each test, wiped clean after
@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


# 3. FastAPI TestClient wired to the SQLite test session
@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[deps.get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# 4. Seed two separate companies & users for RBAC and Multi-Tenant tests
@pytest.fixture(scope="function")
def test_users(db):
    comp_a = Company(name="Company Alpha", code="ALPHA")
    comp_b = Company(name="Company Beta", code="BETA")
    db.add_all([comp_a, comp_b])
    db.commit()
    db.refresh(comp_a)
    db.refresh(comp_b)

    admin_a = User(
        username="admin_a",
        hashed_password=get_password_hash("pass123"),
        role="admin",
        full_name="Admin Alpha",
        company_id=comp_a.id,
    )
    user_a = User(
        username="user_a",
        hashed_password=get_password_hash("pass123"),
        role="user",
        full_name="Employee Alpha",
        company_id=comp_a.id,
    )
    admin_b = User(
        username="admin_b",
        hashed_password=get_password_hash("pass123"),
        role="admin",
        full_name="Admin Beta",
        company_id=comp_b.id,
    )
    db.add_all([admin_a, user_a, admin_b])
    db.commit()

    return {
        "company_a": comp_a,
        "company_b": comp_b,
        "admin_a": admin_a,
        "user_a": user_a,
        "admin_b": admin_b,
    }