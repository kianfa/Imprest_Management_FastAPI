# 🚀 Imprest Management System: Desktop (PyQt6) to FastAPI Migration Guide

A comprehensive, production-ready engineering roadmap and implementation manual for migrating the Imprest Management desktop application to a modern, scalable **FastAPI REST API**.

---

## 📑 Table of Contents
1. [Project Overview & Key Differences](#1-project-overview--key-differences)
2. [Timeline & Milestone Schedule](#2-timeline--milestone-schedule)
3. [Target System Architecture](#3-target-system-architecture)
4. [Step-by-Step Implementation Guide](#4-step-by-step-implementation-guide)
   - [Phase 1: Environment & Project Setup](#phase-1-environment--project-setup)
   - [Phase 2: Database Layer (SQLAlchemy 2.0 & Alembic)](#phase-2-database-layer-sqlalchemy-20--alembic)
   - [Phase 3: Authentication, Security & RBAC](#phase-3-authentication-security--rbac)
   - [Phase 4: Pydantic Validation & Jalali Date Handling](#phase-4-pydantic-validation--jalali-date-handling)
   - [Phase 5: Core CRUD & Multipart File Uploads](#phase-5-core-crud--multipart-file-uploads)
   - [Phase 6: Search, Filtering & Pagination](#phase-6-search-filtering--pagination)
   - [Phase 7: Excel & PDF Server-Side Exports](#phase-7-excel--pdf-server-side-exports)
   - [Phase 8: Configuration, CORS, Static Files & Main App](#phase-8-configuration-cors-static-files--main-app)
   - [Phase 9: Testing, Docker & Deployment](#phase-9-testing-docker--deployment)
5. [Feature Mapping Matrix](#5-feature-mapping-matrix)

---

## 1. Project Overview & Key Differences

The existing desktop application is built with **PyQt6**, **SQLite3**, **jdatetime**, and **openpyxl**. It manages imprest/expense receipts, handles file attachments, enforces basic role-based access control (`admin` vs `user`), and provides export features (PDF/Excel).

### Key Architectural Transformations:
- **Client/Server Decoupling:** The UI logic is completely separated from the business/data logic. The FastAPI app acts as a headless API service consumable by any web (React/Vue/Next.js), mobile (Flutter), or desktop client.
- **Stateless Authentication:** Replacing PyQt in-memory global state (`UserSession`) with stateless **OAuth2 Password Flow + JWT Bearer Tokens**.
- **ORM & Migrations:** Upgrading raw SQLite string-concatenated SQL queries to **SQLAlchemy 2.0 ORM** with **Alembic** migrations for schema versioning.
- **Validation & Serialization:** Automatic input validation and serialization using **Pydantic V2**.
- **File Management:** Converting local dialog file-copy routines (`shutil.copy2`) into standard multipart HTTP uploads (`UploadFile`) with static asset hosting.

---

## 2. Timeline & Milestone Schedule

> **Estimated Total Effort:** **28 – 38 Developer Hours** (approx. 5–7 working days)

| Phase | Module / Task | Key Deliverables | Estimated Time |
| :--- | :--- | :--- | :---: |
| **Phase 1** | **Project Setup & Architecture** | Project scaffolding, virtual environment, dependency management (`pyproject.toml` / `requirements.txt`). | **3 – 4 hrs** |
| **Phase 2** | **Database & ORM Layer** | Database models (`User`, `Record`, `RecordImage`, `Category`), Alembic setup, session manager. | **4 – 5 hrs** |
| **Phase 3** | **Authentication & RBAC** | JWT token generation/verification, bcrypt hashing, role dependency (`admin` vs `user`). | **4 – 5 hrs** |
| **Phase 4** | **Pydantic Schemas & Jalali Dates** | Request/Response DTOs, custom Shamsi date validators (`jdatetime`). | **3 – 4 hrs** |
| **Phase 5** | **Core CRUD & File Uploads** | Imprest record endpoints, multipart file uploads, image storage handling, soft-delete. | **5 – 6 hrs** |
| **Phase 6** | **Search, Filtering & Pagination** | Query parameters for invoice no, project code, Jalali date ranges, full-text description. | **3 – 4 hrs** |
| **Phase 7** | **Reporting & Exports** | Async Excel stream (`openpyxl`), server-side PDF generator (`ReportLab` / `WeasyPrint`). | **4 – 5 hrs** |
| **Phase 8** | **CORS, Static Files & Config** | Environment configuration (`.env`), CORS middleware, static image file serving. | **2 – 3 hrs** |
| **Phase 9** | **Testing & Containerization** | Pytest unit/API tests, Dockerfile, `docker-compose.yml`, Swagger documentation check. | **3 – 4 hrs** |

---

## 3. Target System Architecture

```
imprest_fastapi/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py         # Login, token refresh, current user profile
│   │   │   │   ├── records.py      # CRUD for receipts & invoices
│   │   │   │   ├── categories.py   # Lookup items (Expense centers, types, companies)
│   │   │   │   └── exports.py      # Excel & PDF export endpoints
│   │   │   └── api_router.py       # Main router aggregation
│   │   └── deps.py                 # Dependency injections (get_db, get_current_user, require_admin)
│   ├── core/
│   │   ├── config.py               # Settings (Pydantic BaseSettings, .env)
│   │   └── security.py             # Password hashing (bcrypt) & JWT encoder/decoder
│   ├── db/
│   │   ├── session.py              # SQLAlchemy engine & session factory
│   │   └── init_db.py              # Database seeder (default users)
│   ├── models/
│   │   ├── user.py                 # User ORM model
│   │   ├── record.py               # Imprest record & RecordImage ORM models
│   │   └── category.py             # Preset categories (expense centers, types, etc.)
│   ├── schemas/
│   │   ├── token.py                # JWT Token schemas
│   │   ├── user.py                 # UserCreate, UserOut, UserLogin
│   │   ├── record.py               # RecordCreate, RecordUpdate, RecordOut, RecordFilter
│   │   └── category.py             # CategoryCreate, CategoryOut
│   ├── services/
│   │   ├── record_service.py       # Core business logic & permission checks
│   │   ├── storage_service.py      # File system image storage & cleanup
│   │   └── export_service.py       # Excel (openpyxl) & PDF report generation
│   ├── utils/
│   │   └── solar_date.py           # Jalali calendar converters & formatters
│   └── main.py                     # FastAPI application entry point, CORS, mounts
├── alembic/                        # Migration scripts
├── uploads/                        # Uploaded receipt attachments
├── tests/                          # Automated Pytest suite
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

---

## 4. Step-by-Step Implementation Guide

---

### Phase 1: Environment & Project Setup

#### 1.1 Create Virtual Environment & Install Dependencies
```bash
# Create and activate virtual environment
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate
```

#### 1.2 `requirements.txt`
```text
fastapi>=0.110.0
uvicorn[standard]>=0.28.0
sqlalchemy>=2.0.28
alembic>=1.13.1
pydantic>=2.6.4
pydantic-settings>=2.2.1
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.9
jdatetime>=5.0.0
openpyxl>=3.1.2
reportlab>=4.1.0
pillow>=10.2.0
pytest>=8.1.1
httpx>=0.27.0
```

---

### Phase 2: Database Layer (SQLAlchemy 2.0 & Alembic)

#### 2.1 Database Session (`app/db/session.py`)
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

#### 2.2 ORM Models (`app/models/user.py` & `app/models/record.py`)

**`app/models/user.py`:**
```python
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)  # "admin" | "user"
    full_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    records = relationship("ExpenseRecord", back_populates="creator")
```

**`app/models/record.py`:**
```python
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class ExpenseRecord(Base):
    __tablename__ = "records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_no = Column(String(100), index=True, nullable=False)
    project_code = Column(String(100), index=True, nullable=False)
    explanation = Column(Text, nullable=True)
    amount = Column(Float, nullable=False)
    record_date = Column(String(10), index=True, nullable=False)  # Shamsi "YYYY/MM/DD"
    source_pc = Column(String(100), nullable=True)
    expense_center = Column(String(100), nullable=True)
    expense_type = Column(String(100), nullable=True)
    company_name = Column(String(100), nullable=True)
    
    deleted = Column(Boolean, default=False, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_by_name = Column(String(100), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    last_modified = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", back_populates="records")
    images = relationship("RecordImage", back_populates="record", cascade="all, delete-orphan")

class RecordImage(Base):
    __tablename__ = "record_images"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(36), ForeignKey("records.id"), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)

    record = relationship("ExpenseRecord", back_populates="images")
```

#### 2.3 Initial Seeder (`app/db/init_db.py`)
```python
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import get_password_hash

def init_default_users(db: Session) -> None:
    default_users = [
        ("1", "q", "admin", "Nozhan Ghayati"),
        ("farooghi", "1234asd1234", "admin", "Kian Farooghi"),
        ("chalabi", "12345678", "admin", "Chalabi"),
        ("rahimi", "12345678", "user", "Rahimi"),
        ("user3", "user333", "user", "Eve User"),
    ]
    for username, plain_pw, role, full_name in default_users:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            user = User(
                username=username,
                hashed_password=get_password_hash(plain_pw),
                role=role,
                full_name=full_name
            )
            db.add(user)
    db.commit()
```

---

### Phase 3: Authentication, Security & RBAC

#### 3.1 Security Core (`app/core/security.py`)
```python
from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], role: str, full_name: str, expires_delta: timedelta = None) -> str:
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "full_name": full_name
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
```

#### 3.2 Injected Dependencies (`app/api/deps.py`)
```python
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.config import settings
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user
```

---

### Phase 4: Pydantic Validation & Jalali Date Handling

#### 4.1 Schemas (`app/schemas/record.py`)
```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
import jdatetime

class RecordBase(BaseModel):
    invoice_no: str = Field(..., example="INV-2024-001")
    project_code: str = Field(..., example="PRJ-102")
    explanation: Optional[str] = None
    amount: float = Field(..., gt=0, example=1500000.0)
    record_date: str = Field(..., example="1403/06/22")
    expense_center: Optional[str] = None
    expense_type: Optional[str] = None
    company_name: Optional[str] = None
    source_pc: Optional[str] = None

    @field_validator("record_date")
    def validate_jalali_date(cls, v: str) -> str:
        try:
            parts = [int(p) for p in v.split("/")]
            if len(parts) != 3:
                raise ValueError()
            jdatetime.date(parts[0], parts[1], parts[2])
        except Exception:
            raise ValueError("Invalid Jalali date format. Must be YYYY/MM/DD (e.g. 1403/06/22)")
        return v

class RecordCreate(RecordBase):
    pass

class RecordUpdate(BaseModel):
    invoice_no: Optional[str] = None
    project_code: Optional[str] = None
    explanation: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    record_date: Optional[str] = None
    expense_center: Optional[str] = None
    expense_type: Optional[str] = None
    company_name: Optional[str] = None
    source_pc: Optional[str] = None

    @field_validator("record_date")
    def validate_jalali_date(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return RecordBase.validate_jalali_date(v)

class ImageOut(BaseModel):
    id: int
    file_name: str
    file_path: str

    class Config:
        from_attributes = True

class RecordOut(RecordBase):
    id: str
    deleted: bool
    created_by_name: str
    created_at: datetime
    last_modified: datetime
    images: List[ImageOut] = []

    class Config:
        from_attributes = True
```

---

### Phase 5: Core CRUD & Multipart File Uploads

#### 5.1 Record Endpoints (`app/api/v1/endpoints/records.py`)
```python
from typing import List, Optional
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.core.config import settings
from app.models.user import User
from app.models.record import ExpenseRecord, RecordImage
from app.schemas.record import RecordOut, RecordCreate

router = APIRouter()

@router.post("/", response_model=RecordOut, status_code=status.HTTP_201_CREATED)
def create_record(
    invoice_no: str = Form(...),
    project_code: str = Form(...),
    amount: float = Form(...),
    record_date: str = Form(...),
    explanation: Optional[str] = Form(None),
    expense_center: Optional[str] = Form(None),
    expense_type: Optional[str] = Form(None),
    company_name: Optional[str] = Form(None),
    source_pc: Optional[str] = Form(None),
    images: List[UploadFile] = File([]),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    # Check duplicate active invoice
    exists = db.query(ExpenseRecord).filter(
        ExpenseRecord.invoice_no == invoice_no,
        ExpenseRecord.deleted == False
    ).first()
    if exists:
        raise HTTPException(
            status_code=400,
            detail=f"Invoice number '{invoice_no}' already exists."
        )

    # Validate Shamsi Date
    RecordCreate.validate_jalali_date(record_date)

    record = ExpenseRecord(
        invoice_no=invoice_no,
        project_code=project_code,
        amount=amount,
        record_date=record_date,
        explanation=explanation,
        expense_center=expense_center,
        expense_type=expense_type,
        company_name=company_name,
        source_pc=source_pc,
        created_by_id=current_user.id,
        created_by_name=current_user.full_name,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Upload & save attachments
    if images:
        record_folder = settings.UPLOAD_DIR / str(record.id)
        record_folder.mkdir(parents=True, exist_ok=True)

        for idx, file in enumerate(images, start=1):
            if not file.filename:
                continue
            ext = Path(file.filename).suffix.lower()
            dest_name = f"{idx:03d}{ext}"
            dest_path = record_folder / dest_name

            with open(dest_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            img_entry = RecordImage(
                record_id=record.id,
                file_path=f"/uploads/{record.id}/{dest_name}",
                file_name=dest_name
            )
            db.add(img_entry)
        db.commit()
        db.refresh(record)

    return record

@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(
    record_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    record = db.query(ExpenseRecord).filter(
        ExpenseRecord.id == record_id, 
        ExpenseRecord.deleted == False
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    # Enforce Role-Based Permission
    if current_user.role != "admin" and record.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own records.")

    record.deleted = True
    db.commit()
    return None
```

---

### Phase 6: Search, Filtering & Pagination

```python
@router.get("/", response_model=List[RecordOut])
def get_records(
    invoice_no: Optional[str] = Query(None, description="Search by Invoice number (partial)"),
    project_code: Optional[str] = Query(None, description="Search by Project code (partial)"),
    explanation: Optional[str] = Query(None, description="Search in explanation text"),
    start_date: Optional[str] = Query(None, description="Start date (Jalali: YYYY/MM/DD)"),
    end_date: Optional[str] = Query(None, description="End date (Jalali: YYYY/MM/DD)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    query = db.query(ExpenseRecord).filter(ExpenseRecord.deleted == False)

    if invoice_no:
        query = query.filter(ExpenseRecord.invoice_no.ilike(f"%{invoice_no}%"))
    if project_code:
        query = query.filter(ExpenseRecord.project_code.ilike(f"%{project_code}%"))
    if explanation:
        query = query.filter(ExpenseRecord.explanation.ilike(f"%{explanation}%"))
    if start_date:
        query = query.filter(ExpenseRecord.record_date >= start_date)
    if end_date:
        query = query.filter(ExpenseRecord.record_date <= end_date)

    return query.order_by(ExpenseRecord.created_at.desc()).offset(skip).limit(limit).all()
```

---

### Phase 7: Excel & PDF Server-Side Exports

```python
from io import BytesIO
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.record import ExpenseRecord

router = APIRouter()

@router.get("/excel")
def export_excel(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    query = db.query(ExpenseRecord).filter(ExpenseRecord.deleted == False)
    if start_date:
        query = query.filter(ExpenseRecord.record_date >= start_date)
    if end_date:
        query = query.filter(ExpenseRecord.record_date <= end_date)
    records = query.all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Imprest Records"

    headers = ["No.", "Invoice No", "Project Code", "Explanation", "Amount", "Record Date", "Expense Center", "Company", "Created By"]
    ws.append(headers)

    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal="center")

    for i, r in enumerate(records, start=1):
        ws.append([i, r.invoice_no, r.project_code, r.explanation, r.amount, r.record_date, r.expense_center, r.company_name, r.created_by_name])

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=imprest_records.xlsx"}
    )
```

---

### Phase 8: Configuration, CORS, Static Files & Main App

#### `app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.v1.api_router import api_router
from app.db.session import engine, Base, SessionLocal
from app.db.init_db import init_default_users

# Auto-create tables (or use Alembic migrations)
Base.metadata.create_all(bind=engine)

# Seed default users
with SessionLocal() as db:
    init_default_users(db)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded receipt images
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Attach API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}
```

---

### Phase 9: Testing, Docker & Deployment

#### `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### `docker-compose.yml`:
```yaml
version: '3.8'

services:
  api:
    build: .
    container_name: imprest_api
    ports:
      - "8000:8000"
    volumes:
      - ./uploads:/app/uploads
      - ./imprest.db:/app/imprest.db
    environment:
      - SECRET_KEY=your_production_secret_key_here
      - DATABASE_URL=sqlite:///./imprest.db
    restart: unless-stopped
```

---

## 5. Feature Mapping Matrix

| Desktop Feature (PyQt6 / SQLite) | FastAPI Equivalent Architecture |
| :--- | :--- |
| `QApplication` / `MainWindow` | `FastAPI()` app instance + Uvicorn server |
| Direct `sqlite3.connect()` queries | SQLAlchemy 2.0 ORM + Alembic migrations |
| In-memory `UserSession.username` | Stateless JWT Bearer tokens (`Depends(get_current_user)`) |
| Role checks via `if UserSession.role != 'admin'` | Dependency injection: `Depends(require_admin)` |
| `QFileDialog.getOpenFileNames` | HTML5 `<input type="file" multiple>` + `UploadFile` |
| `QMessageBox.warning(...)` | `raise HTTPException(status_code=400, detail=...)` |
| Local file copy to `./image_records/<id>/` | Storage service saving to `/uploads/<id>/` with URL generation |
| `QPrinter` / `QPainter` PDF generation | Server-side `ReportLab` or `WeasyPrint` streamed as `application/pdf` |
| `QSettings` for custom combo items | `categories` table with simple CRUD endpoints |
