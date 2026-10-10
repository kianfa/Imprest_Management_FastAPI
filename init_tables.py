from app.db.session import engine, SessionLocal, Base
from app.models import Company, User, ExpenseRecord, RecordImage
from app.db.init_db import init_db


def main():
    print("🔨 Creating tables in Supabase PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")

    print("🌱 Seeding initial database data...")
    db = SessionLocal()
    try:
        init_db(db)
        print("🎉 Database initialized and seeded successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    main()