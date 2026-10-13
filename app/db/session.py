from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# PostgreSQL connection engine with connection health checks (pool_pre_ping)
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Automatically reconnects if Supabase drops an idle connection
    pool_size=10,        # Keeps up to 10 active connections in the pool
    max_overflow=20      # Allows up to 20 temporary extra connections under high load
)

# Session factory for database transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy ORM models
Base = declarative_base()