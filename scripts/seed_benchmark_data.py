import sys
import uuid
import random
from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models.record import ExpenseRecord


PROJECT_CODES = ["01 - Solar Project", "02 - North Plant", "10 - Main Office", "35 - Fleet", "99 - R&D"]
EXPENSE_CENTERS = ["Central HQ", "Tehran Branch", "Factory Line 1", "Site B", "Logistics"]
EXPENSE_TYPES = ["ملزومات", "خرید ملزومات", "سوخت و حمل", "پذیرایی", "تعمیرات و نگهداری"]


def generate_jalali_date():
    """Generates random realistic Shamsi dates within year 1403."""
    month = random.randint(1, 12)
    day = random.randint(1, 29)
    return f"1403/{month:02d}/{day:02d}"


def seed_records(total_count: int = 20000, chunk_size: int = 1000):
    """Bulk inserts realistic expense records for performance benchmarking."""
    db = SessionLocal()
    print(f"🚀 Starting benchmark data generation ({total_count:,} records)...")
    start_time = datetime.now()

    try:
        inserted = 0
        while inserted < total_count:
            batch = []
            current_batch_size = min(chunk_size, total_count - inserted)

            for i in range(current_batch_size):
                idx = inserted + i + 1
                record_dict = {
                    "id": str(uuid.uuid4()),
                    "company_id": 1,
                    "invoice_no": f"BENCH-{idx:06d}",
                    "project_code": random.choice(PROJECT_CODES),
                    "expense_center": random.choice(EXPENSE_CENTERS),
                    "expense_type": random.choice(EXPENSE_TYPES),
                    "explanation": f"Automated benchmark expense record #{idx} for high-scale performance testing.",
                    "amount": float(random.randint(50_000, 75_000_000)),
                    "record_date": generate_jalali_date(),
                    "source_pc": "BENCHMARK-RUNNER",
                    "deleted": False,
                    "created_by_id": 1,
                    "created_by_name": "Kian Farooghi (Admin)",
                    "created_at": datetime.now() - timedelta(days=random.randint(0, 365)),
                    "last_modified": datetime.now(),
                }
                batch.append(record_dict)

            # High-performance bulk insert bypasses individual ORM overhead
            db.bulk_insert_mappings(ExpenseRecord, batch)
            db.commit()
            inserted += len(batch)
            print(f"   Inserted {inserted:,} / {total_count:,} records...")

        elapsed = (datetime.now() - start_time).total_seconds()
        print(f"✅ Successfully seeded {total_count:,} records in {elapsed:.2f} seconds!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during seed: {e}")
        raise
    finally:
        db.close()


def clean_benchmark_records():
    """Removes all generated benchmark records."""
    db = SessionLocal()
    print("🧹 Cleaning up benchmark records...")
    try:
        deleted_count = db.query(ExpenseRecord).filter(ExpenseRecord.invoice_no.like("BENCH-%")).delete(synchronize_session=False)
        db.commit()
        print(f"✅ Deleted {deleted_count:,} benchmark records.")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--clean":
        clean_benchmark_records()
    else:
        seed_records(20000)