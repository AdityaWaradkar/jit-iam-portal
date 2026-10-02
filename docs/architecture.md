# Architecture

> Full architecture document. Populated as the project is built.

## High-Level Flow

1. User (persona) logs in to the Next.js portal.
2. Submits an access request (env, role, duration, justification).
3. FastAPI orchestrator passes the request to Open Policy Agent.
4. OPA returns `allow` / `deny` / `requires_approval` + reasoning.
5. If approval required → Slack-style interactive card → approver decision.
6. On approval → HashiCorp Vault → AWS STS AssumeRole → ephemeral credentials.
7. Credentials displayed with live countdown; revoked automatically at TTL.
8. Every lifecycle event written to immutable audit store.

*(diagram and detailed sequence flow added in later sections)*