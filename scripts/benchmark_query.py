from sqlalchemy import text
from app.db.session import SessionLocal


QUERY = """
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, invoice_no, record_date, amount, created_at
FROM records
WHERE company_id = 1
  AND deleted = FALSE
  AND record_date >= '1403/01/01'
  AND record_date <= '1403/08/30'
ORDER BY created_at DESC
LIMIT 50;
"""


def run_benchmark():
    db = SessionLocal()
    print("=" * 70)
    print("🔍 RUNNING EXPLAIN (ANALYZE, BUFFERS)...")
    print("=" * 70)
    try:
        result = db.execute(text(QUERY)).fetchall()
        print("\n".join(row[0] for row in result))
    finally:
        db.close()


if __name__ == "__main__":
    run_benchmark()