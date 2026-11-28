# CashTrack — Imprest Management System

A multi-tenant expense and imprest management platform built with **FastAPI**, **PostgreSQL (Supabase)**, **Supabase Storage**, and **Next.js 16 (App Router)**. Designed for Persian (`FA` RTL) and English (`EN` LTR) teams with Shamsi (Jalali) calendar support, real-time WebP receipt optimization, issue ticketing, and printable PDF/Excel reporting.

---

## Key Features

- **Multi-Tenant Isolation & RBAC**: Company-scoped queries (`company_id`) with JWT (`HS256`) authentication and role-based permissions (`admin` vs. `user`).
- **Expense Records & Jalali Dates**: Full CRUD with Shamsi (`YYYY/MM/DD`) date validation (`jdatetime`), custom Jalali calendar picker, and multi-criteria filtering (invoice number, project code, expense center, date range).
- **End-to-End WebP Image Pipeline**:
  - **Client-side**: In-browser HTML5 Canvas downscaling and WebP compression prior to upload (`imageCompression.ts`).
  - **Server-side**: Pillow + `pillow-heif` pipeline with mobile EXIF auto-rotation, RGBA-to-RGB white-background flattening, 1920px max-dimension resizing, and WebP encoding before uploading to Supabase Storage (`storage_services.py`).
- **Record Issue Ticketing**: Threaded problem reporting (`OPEN` / `RESOLVED`) attached to expense records (`record_tickets`) with in-table notification badges.
- **Persian RTL PDF & Excel Exports**: Streamed `.xlsx` (`openpyxl`) and Persian-reshaped RTL `.pdf` (`reportlab`, `arabic-reshaper`, `python-bidi`) exports with optional embedded receipt images.
- **Bilingual UI (FA / EN)**: Instant `RTL ↔ LTR` layout switching, dark/light theme support, and responsive desktop table + mobile card views.
- **High-Scale Query Optimization**: Composite partial B-Tree indexing on `records (company_id, created_at DESC, record_date) WHERE deleted = false`, indexed foreign keys on `record_images` and `record_tickets`, and `selectinload` eager loading to eliminate `N+1` queries.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend API** | Python 3.12, FastAPI, Pydantic v2, Uvicorn |
| **Database & ORM** | PostgreSQL (Supabase), SQLAlchemy 2.0, Alembic |
| **Storage & Auth** | Supabase Storage, `python-jose` (JWT), `passlib` + `bcrypt` |
| **Documents & Media** | Pillow, `pillow-heif`, ReportLab, OpenPyXL, `jdatetime`, `arabic-reshaper`, `python-bidi` |
| **Frontend Web** | Next.js 16.4.6 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Lucide Icons |
| **Testing** | Pytest, HTTPX |

---

## Project Structure

```text
Imprest_Management_FastAPI/
├── app/
│   ├── api/
│   │   ├── deps.py                # Auth & DB session dependencies
│   │   └── v1/
│   │       ├── api_router.py      # Central v1 route registration
│   │       └── endpoints/         # auth, records, tickets, project_codes, expense_centers, categories, users
│   ├── core/                      # Settings (.env), security, Supabase client
│   ├── db/                        # SQLAlchemy engine & SessionLocal
│   ├── models/                    # ORM models (User, Company, ExpenseRecord, RecordImage, RecordTicket, lookups)
│   ├── schemas/                   # Pydantic request/response schemas
│   ├── services/                  # WebP storage, PDF export, Excel export
│   ├── utils/                     # Jalali date helpers
│   └── main.py                    # FastAPI app, CORS, OpenAPI 3.0.3 tweaks, /health
├── alembic/                       # Database schema & index migrations
├── scripts/                       # High-scale benchmark seeding & EXPLAIN profiling scripts
├── tests/                         # Pytest API & security tests
├── imprest-management-web/        # Next.js 16 frontend application
├── docker-compose.yml             # Containerized API setup
├── Dockerfile
├── requirements.txt
└── SYSTEM_DESIGN.md               # Scaling architecture & optimization roadmap
```

---

## Getting Started

### 1. Backend Setup (FastAPI)

Create and activate a Python virtual environment, then install dependencies:

```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the project root (`Imprest_Management_FastAPI/.env`):

```env
DATABASE_URL=postgresql://user:password@host:port/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-or-anon-key
SUPABASE_BUCKET_NAME=Imprest_Pics
SECRET_KEY=replace-with-a-strong-random-secret
```

Apply database migrations and start the API server:

```bash
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- **Swagger API Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/health`

---

### 2. Frontend Setup (Next.js)

In a separate terminal:

```bash
cd imprest-management-web
npm install
```

Create `imprest-management-web/.env.local` (optional; defaults to `http://127.0.0.1:8000/api/v1`):

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

### 3. Running Backend with Docker (Optional)

```bash
docker-compose up --build
```

---

## API Modules (`/api/v1`)

| Prefix | Tag | Purpose |
| :--- | :--- | :--- |
| `/api/v1/auth` | Authentication | Login (`OAuth2` / JWT token issuance) and current user profile |
| `/api/v1/records` | Expense Records | CRUD records, gallery images (`POST/DELETE`), Excel & PDF exports |
| `/api/v1/records/{id}/tickets` | Record Tickets | Create, list, and resolve record issue tickets |
| `/api/v1/project-codes` | Project Codes | Manage company project codes |
| `/api/v1/expense-centers` | Expense Centers | Manage company expense centers |
| `/api/v1/categories` | Categories | Manage expense categories |
| `/api/v1/users` | User Management | Admin user creation and role management |

---

## Testing & Performance Benchmarking

Run the automated test suite:

```bash
pytest
```

Run the PostgreSQL query benchmarking & cleanup scripts:

```bash
# Seed 20,000 synthetic records
python -m scripts.seed_benchmark_data

# Inspect EXPLAIN (ANALYZE, BUFFERS) execution plan
python -m scripts.benchmark_query

# Remove all synthetic benchmark records
python -m scripts.seed_benchmark_data --clean
```

---

## Architecture & Roadmap

See [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) for the high-scale system design covering PostgreSQL indexing, PgBouncer connection pooling, Redis caching, and asynchronous export workers.
