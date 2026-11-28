from sqlalchemy import text
from app.db.session import SessionLocal


CREATE_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS ix_records_benchmark_opt 
ON records (company_id, created_at DESC, record_date) 
WHERE deleted = FALSE;
"""


def apply_index():
    db = SessionLocal()
    print("⚡ Creating Composite Partial B-Tree Index on PostgreSQL...")
    try:
        db.execute(text(CREATE_INDEX_SQL))
        db.commit()
        print("✅ Index created successfully!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating index: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    apply_index()