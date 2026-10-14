import hashlib
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Protocol

from app.core.config import get_settings


@dataclass(frozen=True)
class IssuedCredential:
    access_key_id: str
    secret_access_key: str
    session_token: str
    expires_at: datetime
    secret_access_key_hash: str
    session_token_hash: str


class CredentialIssuer(Protocol):
    def issue(
        self,
        requested_role: str,
        duration_minutes: int,
    ) -> IssuedCredential: ...


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _fake_access_key_id() -> str:
    # AWS STS access key IDs start with ASIA. Generate 16 alphanumeric
    # characters after the prefix, giving a realistic looking key.
    suffix = "".join(
        secrets.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
        for _ in range(16)
    )
    return f"ASIA{suffix}"


def _fake_secret_access_key() -> str:
    return "".join(
        secrets.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/+")
        for _ in range(40)
    )


def _fake_session_token() -> str:
    # Session tokens are long. 200 characters is realistic.
    return "".join(
        secrets.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/+=")
        for _ in range(200)
    )


class MockIssuer:
    """Generates realistic looking credentials without touching AWS.

    Used in demo mode so the sandbox never calls real cloud APIs.
    """

    def issue(
        self,
        requested_role: str,
        duration_minutes: int,
    ) -> IssuedCredential:
        now = datetime.now(UTC)
        expires_at = now + timedelta(minutes=duration_minutes)

        access_key_id = _fake_access_key_id()
        secret_access_key = _fake_secret_access_key()
        session_token = _fake_session_token()

        return IssuedCredential(
            access_key_id=access_key_id,
            secret_access_key=secret_access_key,
            session_token=session_token,
            expires_at=expires_at,
            secret_access_key_hash=_hash(secret_access_key),
            session_token_hash=_hash(session_token),
        )


class VaultIssuer:
    """Placeholder for a real HashiCorp Vault integration.

    In a production deployment, this class would call the Vault AWS
    Secrets Engine to assume a target IAM role and return the resulting
    STS credentials. Not implemented in this project.
    """

    def issue(
        self,
        requested_role: str,
        duration_minutes: int,
    ) -> IssuedCredential:
        raise NotImplementedError(
            "VaultIssuer is not implemented in this build. "
            "Set DEMO_MODE=true to use the mock issuer."
        )


def get_issuer() -> CredentialIssuer:
    settings = get_settings()
    if settings.demo_mode:
        return MockIssuer()
    return VaultIssuer()