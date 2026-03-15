from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://capman:capman@db:5432/capman"
    redis_url: str = "redis://redis:6379/0"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    langsmith_enabled: bool = False
    langsmith_api_key: str = ""
    langsmith_project: str = "the-pit"
    langsmith_endpoint: str = "https://api.smith.langchain.com"
    generation_cache_enabled: bool = True
    generation_cache_ttl_seconds: int = 600
    rag_max_chunks: int = 3
    rag_max_chunk_chars: int = 700
    rag_max_total_chars: int = 2200
    jwt_secret_key: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 10080  # 7 days
    atlas_api_url: str = ""
    atlas_api_key: str = ""
    atlas_enabled: bool = False
    app_env: str = "development"  # "development", "staging", or "production"
    app_port: int = 8000
    frontend_url: str = "http://localhost:5173"
    cors_origins: str = "http://localhost:5173"
    log_level: str = "INFO"

    model_config = {"env_file": ".env", "extra": "ignore"}

    @model_validator(mode="after")
    def fix_database_url_scheme(self):
        """Railway injects DATABASE_URL as postgresql:// but asyncpg needs postgresql+asyncpg://"""
        if self.database_url.startswith("postgresql://"):
            self.database_url = self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self


settings = Settings()
