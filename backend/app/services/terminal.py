import hashlib
import json
import shlex
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit_types import AuditEventType
from app.db.models import AuditEvent, Lease, LeaseStatus


@dataclass
class CommandResult:
    exit_code: int
    stdout: str
    stderr: str


class TerminalError(Exception):
    """Raised when the terminal session cannot continue."""


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


async def load_lease_by_access_key(
    db: AsyncSession,
    access_key_id: str,
) -> Lease | None:
    result = await db.execute(
        select(Lease).where(Lease.access_key_id == access_key_id)
    )
    return result.scalar_one_or_none()


def verify_credential(
    lease: Lease,
    secret_access_key: str,
    session_token: str,
) -> str:
    """Return the credential status. One of: valid, expired, revoked, invalid."""
    if lease.status == LeaseStatus.EXPIRED:
        return "expired"
    if lease.status == LeaseStatus.REVOKED:
        return "revoked"

    if lease.expires_at <= datetime.now(UTC):
        return "expired"

    if _hash(secret_access_key) != lease.secret_access_key_hash:
        return "invalid"

    if session_token and _hash(session_token) != lease.session_token_hash:
        return "invalid"

    return "valid"


def _format_caller_identity(lease: Lease) -> CommandResult:
    role_arn = (
        lease.assumed_role_arn or "arn:aws:iam::123456789012:role/UnknownRole"
    )
    role_name = lease.assumed_role_name or "UnknownRole"
    account_id = role_arn.split(":")[4] if ":" in role_arn else "123456789012"
    session_suffix = f"jit-{str(lease.user_id)[:12]}"

    body = {
        "UserId": f"AROA{_hash(role_name)[:16].upper()}:{session_suffix}",
        "Account": account_id,
        "Arn": f"{role_arn}/{session_suffix}",
    }
    return CommandResult(
        exit_code=0,
        stdout=json.dumps(body, indent=4),
        stderr="",
    )


def _format_s3_ls(lease: Lease) -> CommandResult:
    now = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S")
    lines = [
        f"{now}    PRE jit-portal-artifacts/",
        f"{now}    PRE jit-portal-audit/",
        f"{now}    PRE jit-portal-config/",
    ]
    return CommandResult(exit_code=0, stdout="\n".join(lines), stderr="")


def _format_whoami(lease: Lease) -> CommandResult:
    role_name = lease.assumed_role_name or "unknown"
    return CommandResult(
        exit_code=0,
        stdout=f"jit-{str(lease.user_id)[:12]} assuming {role_name}",
        stderr="",
    )


def _format_env(lease: Lease) -> CommandResult:
    lines = [
        f"AWS_ACCESS_KEY_ID={lease.access_key_id}",
        "AWS_SECRET_ACCESS_KEY=***",
        "AWS_SESSION_TOKEN=***",
        f"AWS_ROLE_ARN={lease.assumed_role_arn or 'unknown'}",
    ]
    return CommandResult(exit_code=0, stdout="\n".join(lines), stderr="")


def _format_help() -> CommandResult:
    lines = [
        "Supported commands in the JIT IAM Portal sandbox terminal:",
        "",
        "  aws sts get-caller-identity   Show the assumed role identity",
        "  aws s3 ls                     List sample buckets",
        "  whoami                        Show the current session name",
        "  env                           Show credential environment variables",
        "  help                          Show this help text",
        "  clear                         Clear the terminal",
        "",
        "Other AWS CLI commands are not supported in the sandbox.",
    ]
    return CommandResult(exit_code=0, stdout="\n".join(lines), stderr="")


def _unsupported(command: str) -> CommandResult:
    return CommandResult(
        exit_code=1,
        stdout="",
        stderr=(
            f"jit-terminal: command not supported in sandbox: {command}\n"
            "Type 'help' to see supported commands."
        ),
    )


def _invalid_credentials(error_code: str) -> CommandResult:
    return CommandResult(
        exit_code=1,
        stdout="",
        stderr=(
            f"An error occurred ({error_code}) when calling the "
            "GetCallerIdentity operation: The security token included in "
            "the request is invalid."
        ),
    )


def _expired_credentials() -> CommandResult:
    return CommandResult(
        exit_code=1,
        stdout="",
        stderr=(
            "An error occurred (ExpiredToken) when calling the "
            "GetCallerIdentity operation: The security token included in "
            "the request is expired."
        ),
    )


async def run_command(
    db: AsyncSession,
    access_key_id: str,
    secret_access_key: str,
    session_token: str,
    command: str,
    actor_id: UUID | None,
) -> CommandResult:
    """Look up the lease, verify credentials, and dispatch the command."""
    lease = await load_lease_by_access_key(db, access_key_id)
    if lease is None:
        return _invalid_credentials("InvalidClientTokenId")

    status = verify_credential(lease, secret_access_key, session_token)
    if status == "expired":
        return _expired_credentials()
    if status == "invalid":
        return _invalid_credentials("InvalidClientTokenId")
    if status == "revoked":
        return _invalid_credentials("AccessDenied")

    # First successful use of this lease writes a credential.used event.
    await _record_first_use(db, lease, actor_id)

    try:
        argv = shlex.split(command.strip())
    except ValueError:
        return CommandResult(
            exit_code=1,
            stdout="",
            stderr="jit-terminal: could not parse command\n",
        )

    if not argv:
        return CommandResult(exit_code=0, stdout="", stderr="")

    if argv[0] == "clear":
        return CommandResult(exit_code=0, stdout="", stderr="")

    if argv[0] == "help":
        return _format_help()

    if argv[0] == "whoami":
        return _format_whoami(lease)

    if argv[0] == "env":
        return _format_env(lease)

    if (
        len(argv) >= 3
        and argv[0] == "aws"
        and argv[1] == "sts"
        and argv[2] == "get-caller-identity"
    ):
        return _format_caller_identity(lease)

    if (
        len(argv) >= 3
        and argv[0] == "aws"
        and argv[1] == "s3"
        and argv[2] == "ls"
    ):
        return _format_s3_ls(lease)

    return _unsupported(command)


async def _record_first_use(
    db: AsyncSession,
    lease: Lease,
    actor_id: UUID | None,
) -> None:
    existing = await db.execute(
        select(AuditEvent).where(
            AuditEvent.lease_id == lease.id,
            AuditEvent.event_type == AuditEventType.CREDENTIAL_USED,
        )
    )
    if existing.scalar_one_or_none() is not None:
        return

    db.add(
        AuditEvent(
            event_type=AuditEventType.CREDENTIAL_USED,
            actor_id=actor_id,
            request_id=lease.request_id,
            lease_id=lease.id,
            payload={"access_key_id": lease.access_key_id},
        )
    )
    await db.commit()