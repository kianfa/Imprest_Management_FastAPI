import sys
from app.core.config import settings
from app.db.session import engine
from sqlalchemy import text
from supabase import create_client


def test_configurations():
    print("=" * 60)
    print("🔍 1. TESTING .ENV VARIABLES & CONFIG")
    print("=" * 60)
    print(f"✅ Project Name: {settings.PROJECT_NAME}")
    print(f"✅ API Prefix:   {settings.API_V1_STR}")
    print(f"✅ Algorithm:    {settings.ALGORITHM}")
    print(f"✅ Token Expiry: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
    print(f"✅ Supabase URL: {settings.SUPABASE_URL}")
    print(f"✅ Bucket Name:  {settings.SUPABASE_BUCKET_NAME}")

    # Hide password in output for security
    masked_db_url = settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "..."
    print(f"✅ Database Host: ...@{masked_db_url}")
    print("\n")


def test_database_connection():
    print("=" * 60)
    print("🐘 2. TESTING SUPABASE POSTGRESQL CONNECTION")
    print("=" * 60)
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();")).fetchone()
            print("🎉 Database Connection Successful!")
            print(f"ℹ️ PostgreSQL Version: {result[0]}")
    except Exception as e:
        print("❌ DATABASE CONNECTION FAILED:")
        print(f"Error Details: {e}")
    print("\n")


def test_supabase_storage():
    print("=" * 60)
    print("📦 3. TESTING SUPABASE STORAGE CLIENT")
    print("=" * 60)
    try:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        print(f"🎉 Supabase Storage Connected Successfully!")
        print(f"ℹ️ Found Buckets: {bucket_names}")

        if settings.SUPABASE_BUCKET_NAME in bucket_names:
            print(f"✅ Bucket '{settings.SUPABASE_BUCKET_NAME}' exists and is ready!")
        else:
            print(f"⚠️ Warning: Bucket '{settings.SUPABASE_BUCKET_NAME}' was not found in Supabase.")
            print(f"👉 Please go to Supabase Dashboard ➡️ Storage ➡️ Create Bucket '{settings.SUPABASE_BUCKET_NAME}'")
    except Exception as e:
        print("❌ SUPABASE STORAGE CONNECTION FAILED:")
        print(f"Error Details: {e}")
    print("=" * 60)


if __name__ == "__main__":
    test_configurations()
    test_database_connection()
    test_supabase_storage()