from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Ophtech API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = "postgresql://visioncare:visioncare@db:5432/visioncare"

    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost"]

    # Email — Resend API
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "Ophtech <onboarding@resend.dev>"

    # Google Places API — optional. When set, the public booking page shows
    # the doctor's Google reviews inline. Without it, only the map + a link
    # to the doctor's Google profile are shown.
    GOOGLE_PLACES_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
