from typing import Any, Literal

import httpx
import structlog

from app.core.config import get_settings

logger = structlog.get_logger(__name__)


PolicyDecisionValue = Literal["allow", "requires_approval", "deny"]


class PolicyDecision:
    decision: PolicyDecisionValue
    reason: str

    def __init__(self, decision: PolicyDecisionValue, reason: str) -> None:
        self.decision = decision
        self.reason = reason


class PolicyError(Exception):
    """Raised when the policy engine cannot be reached or returns invalid data."""


def _fallback_decision(reason: str) -> PolicyDecision:
    """Fail-closed default: send to manual review if the engine is unavailable."""
    return PolicyDecision(decision="requires_approval", reason=reason)


async def evaluate_access_request(payload: dict[str, Any]) -> PolicyDecision:
    settings = get_settings()

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(settings.opa_url, json={"input": payload})
            response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("opa_request_failed", error=str(exc))
        return _fallback_decision(
            "Policy engine unavailable. Request sent to manual review."
        )

    try:
        body = response.json()
    except ValueError:
        logger.warning("opa_invalid_json", body=response.text[:200])
        return _fallback_decision(
            "Policy engine returned invalid JSON. Request sent to manual review."
        )

    result = body.get("result")
    if not isinstance(result, dict):
        logger.warning("opa_unexpected_shape", result=result)
        return _fallback_decision(
            "Policy engine returned an unexpected shape. Request sent to manual review."
        )

    decision = result.get("decision")
    reason = result.get("reason", "")

    if decision not in ("allow", "requires_approval", "deny"):
        logger.warning("opa_invalid_decision", decision=decision)
        return _fallback_decision(
            "Policy engine returned an unknown decision. Request sent to manual review."
        )

    return PolicyDecision(decision=decision, reason=reason)