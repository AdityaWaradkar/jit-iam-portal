from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Application
    app_name: str = "JIT IAM Portal Backend"
    app_env: str = Field(default="development", alias="APP_ENV")
    debug: bool = Field(default=True, alias="DEBUG")

    # API
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://jit:jit@localhost:5432/jit",
        alias="DATABASE_URL",
    )

    # Redis (used later for background workers)
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    # OPA (used in Section 8)
    opa_url: str = Field(default="http://localhost:8181/v1/data/jit/allow", alias="OPA_URL")

    # Vault (used in Section 12)
    vault_addr: str = Field(default="http://localhost:8200", alias="VAULT_ADDR")
    vault_token: str = Field(default="dev-root-token", alias="VAULT_TOKEN")

    # JWT (used in Section 6)
    jwt_secret: str = Field(default="change-me-in-production", alias="JWT_SECRET")
    jwt_expires_minutes: int = Field(default=60, alias="JWT_EXPIRES_MINUTES")

    # Demo mode (used in Section 22)
    demo_mode: bool = Field(default=True, alias="DEMO_MODE")


@lru_cache
def get_settings() -> Settings:
    return Settings()