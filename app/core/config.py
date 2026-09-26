from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Imprest Management API"
    API_V1_STR: str = "/api/v1"

    # JWT Authentication
    SECRET_KEY: str = "temporary_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Supabase PostgreSQL Database URL
    DATABASE_URL: str

    # Supabase Cloud Storage & Client Settings
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_BUCKET_NAME: str = "Imprest_Pics"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()