from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://capman:capman@db:5432/capman"
    redis_url: str = "redis://redis:6379/0"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    jwt_secret_key: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60
    atlas_api_url: str = ""
    atlas_api_key: str = ""
    atlas_enabled: bool = False
    app_env: str = "development"
    app_port: int = 8000
    frontend_url: str = "http://localhost:5173"
    cors_origins: str = "http://localhost:5173"
    log_level: str = "INFO"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
