Backend : FastAPI Orchestrator

Python service that handles access requests, policy evaluation, approval workflows, credential issuance, and audit logging for the JIT IAM Portal.

Responsibilities

- Receive access requests from the frontend portal
- Evaluate requests against Open Policy Agent policies
- Coordinate approval workflows (Slack simulator, approver queue)
- Issue ephemeral credentials via HashiCorp Vault and AWS STS
- Stream every lifecycle event to the audit log
- Monitor active leases and revoke them at expiry

Structure

```
app/
  api/              HTTP routers, versioned under /api/v1
    v1/
      health.py     Health check endpoint
    router.py       Aggregates all v1 routers
  core/
    config.py       Pydantic settings loaded from environment variables
    logging.py      Structured logging configuration (structlog)
  db/
    session.py      Async SQLAlchemy engine and session factory
  main.py           FastAPI application entry point
tests/              Pytest suite
alembic/            Database migrations
```

Requirements

- Python 3.11 or newer
- PostgreSQL (available via the root docker-compose.yml)
- Redis (available via the root docker-compose.yml)

Local development

From the backend/ directory:

```
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -e ".[dev]"
```

Run the development server:

```
uvicorn app.main:app --reload
```

The API is now available at:

- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health check: http://localhost:8000/api/v1/health

Configuration

All configuration is loaded from environment variables via Pydantic Settings. See the root .env.example for the full list.

Key variables:

```
APP_ENV              Environment name (development, production), default development
DEBUG                Enables verbose logging and SQL echo, default true
DATABASE_URL         Async Postgres connection string, local dev default
REDIS_URL            Redis connection string, local dev default
OPA_URL              Open Policy Agent decision endpoint, local dev default
VAULT_ADDR           HashiCorp Vault address, local dev default
JWT_SECRET           Signing key for session tokens, placeholder
```

Copy the root .env.example to .env and adjust as needed.

Tests

```
pytest
```

With coverage:

```
pytest --cov=app --cov-report=term-missing
```

Linting and type checking

```
ruff check .
ruff format .
mypy app
```

Docker

Build the image:

```
docker build -t jit-iam-backend .
```

Run it standalone:

```
docker run --rm -p 8000:8000 --env-file ../.env jit-iam-backend
```

Or run the full local stack from the repository root:

```
docker compose --profile full up --build
```

Database migrations

Alembic is configured but no migrations exist yet. The first migration is generated in Section 5 of the roadmap, once SQLAlchemy models are defined.

Common commands (run from backend/):

```
alembic revision --autogenerate -m "description of change"
alembic upgrade head
alembic downgrade -1
```

Roadmap reference

This service is built incrementally. See docs/roadmap.md at the repository root for the full plan. Relevant sections:

- Section 2 : Backend skeleton (this section)
- Section 5 : Database schema and seed data
- Section 6 : Persona authentication (JWT)
- Section 7 : Access request API
- Section 8 : OPA policy integration
- Section 12 : Mock Vault and STS credential issuance
- Section 15 : Background lease expiry worker
- Section 18 : Audit event pipeline

---
