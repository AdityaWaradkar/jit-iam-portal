import hashlib
import secrets
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Protocol

import structlog

from app.core.config import get_settings

logger = structlog.get_logger(__name__)


# ---------------------------------------------------------------------
# Data shapes
# ---------------------------------------------------------------------


@dataclass(frozen=True)
class AssumedRoleIdentity:
    """Identity that AWS STS returns when assuming a role.

    Mirrors the fields returned by `aws sts get-caller-identity` when
    the caller is using temporary credentials obtained from AssumeRole.
    """

    account_id: str
    role_name: str
    role_arn: str
    session_name: str


@dataclass(frozen=True)
class IssuedCredential:
    """The result of a credential issuance.

    Fields are a superset of what the frontend needs. The extra fields
    mirror what Vault's AWS Secrets Engine returns, so the mock and a
    real integration produce the same shape.
    """

    access_key_id: str
    secret_access_key: str
    session_token: str
    expires_at: datetime
    secret_access_key_hash: str
    session_token_hash: str

    # Extra fields for realism. Not exposed to the frontend.
    lease_id: str
    lease_duration_seconds: int
    renewable: bool
    assumed_role: AssumedRoleIdentity
    sts_request_id: str
    session_policy_hash: str | None = field(default=None)


class CredentialIssuer(Protocol):
    def issue(
        self,
        requested_role: str,
        duration_minutes: int,
        requested_by: str,
    ) -> IssuedCredential: ...


class CredentialError(Exception):
    """Raised when credential issuance fails."""


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------


FAKE_ACCOUNT_ID = "123456789012"


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _random_string(alphabet: str, length: int) -> str:
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _fake_access_key_id() -> str:
    # AWS STS temporary access key IDs start with ASIA.
    return f"ASIA{_random_string('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 16)}"


def _fake_secret_access_key() -> str:
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/+"
    return _random_string(alphabet, 40)


def _fake_session_token() -> str:
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/+="
    return _random_string(alphabet, 200)


def _fake_sts_request_id() -> str:
    return str(uuid.uuid4())


def _role_arn(role_name: str) -> str:
    return f"arn:aws:iam::{FAKE_ACCOUNT_ID}:role/{role_name}"


# ---------------------------------------------------------------------
# Mock STS engine
# ---------------------------------------------------------------------


class MockSTSEngine:
    """Simulates AWS Security Token Service.

    Generates credentials with the correct prefix and format, and
    returns an assumed role identity that matches what STS would return.
    """

    def assume_role(
        self,
        role_name: str,
        session_name: str,
        duration_minutes: int,
        session_policy: str | None,
    ) -> IssuedCredential:
        now = datetime.now(UTC)
        expires_at = now + timedelta(minutes=duration_minutes)

        access_key_id = _fake_access_key_id()
        secret_access_key = _fake_secret_access_key()
        session_token = _fake_session_token()

        assumed_role = AssumedRoleIdentity(
            account_id=FAKE_ACCOUNT_ID,
            role_name=role_name,
            role_arn=_role_arn(role_name),
            session_name=session_name,
        )

        return IssuedCredential(
            access_key_id=access_key_id,
            secret_access_key=secret_access_key,
            session_token=session_token,
            expires_at=expires_at,
            secret_access_key_hash=_hash(secret_access_key),
            session_token_hash=_hash(session_token),
            lease_id=str(uuid.uuid4()),
            lease_duration_seconds=duration_minutes * 60,
            renewable=False,
            assumed_role=assumed_role,
            sts_request_id=_fake_sts_request_id(),
            session_policy_hash=_hash(session_policy) if session_policy else None,
        )


# ---------------------------------------------------------------------
# Mock Vault engine
# ---------------------------------------------------------------------


class MockVaultEngine:
    """Simulates HashiCorp Vault's AWS Secrets Engine.

    Vault does not generate credentials itself. It authenticates to AWS
    using an administrative IAM role, calls STS AssumeRole on behalf of
    the caller, and returns the resulting credentials wrapped in a lease.
    This mock mirrors that behavior.
    """

    def __init__(self, sts: MockSTSEngine) -> None:
        self._sts = sts

    def issue_credential(
        self,
        requested_role: str,
        duration_minutes: int,
        requested_by: str,
    ) -> IssuedCredential:
        session_name = f"jit-{requested_by.replace('-', '')[:12]}"

        logger.info(
            "vault_request_received",
            role=requested_role,
            requested_by=requested_by,
            requested_duration_minutes=duration_minutes,
        )

        credential = self._sts.assume_role(
            role_name=requested_role,
            session_name=session_name,
            duration_minutes=duration_minutes,
            session_policy=None,
        )

        logger.info(
            "vault_lease_created",
            lease_id=credential.lease_id,
            role=requested_role,
            lease_duration_seconds=credential.lease_duration_seconds,
            renewable=credential.renewable,
            assumed_role_arn=credential.assumed_role.role_arn,
            sts_request_id=credential.sts_request_id,
        )

        return credential


# ---------------------------------------------------------------------
# Public issuers
# ---------------------------------------------------------------------


class MockIssuer:
    """Public issuer that runs the mock Vault stack in demo mode."""

    def __init__(self) -> None:
        self._vault = MockVaultEngine(MockSTSEngine())

    def issue(
        self,
        requested_role: str,
        duration_minutes: int,
        requested_by: str,
    ) -> IssuedCredential:
        try:
            return self._vault.issue_credential(
                requested_role=requested_role,
                duration_minutes=duration_minutes,
                requested_by=requested_by,
            )
        except Exception as exc:
            logger.error("vault_issue_failed", error=str(exc))
            raise CredentialError(
                f"Credential issuance failed: {exc}"
            ) from exc


class VaultIssuer:
    """Placeholder for a real HashiCorp Vault integration.

    In a production deployment, this class would call the Vault AWS
    Secrets Engine over HTTP, using the token in Settings.vault_token.
    The response shape would match the IssuedCredential dataclass.
    """

    def issue(
        self,
        requested_role: str,
        duration_minutes: int,
        requested_by: str,
    ) -> IssuedCredential:
        raise NotImplementedError(
            "VaultIssuer requires a live Vault instance. "
            "Set DEMO_MODE=true to use the mock issuer."
        )


def get_issuer() -> CredentialIssuer:
    settings = get_settings()
    if settings.demo_mode:
        return MockIssuer()
    return VaultIssuer()