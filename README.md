# JIT IAM Portal

**Zero Trust Ephemeral Access and Just In Time Cloud IAM Portal**

Eliminate static credentials. Enforce Zero Standing Privileges. Grant access only when needed, and revoke it automatically.

[![CI](https://github.com/adityawaradkar/jit-iam-portal/actions/workflows/ci.yml/badge.svg)](https://github.com/adityawaradkar/jit-iam-portal/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Go](https://img.shields.io/badge/Go-00ADD8?logo=go)](https://go.dev/)
[![OPA](https://img.shields.io/badge/OPA-Rego-7D9199?logo=openpolicyagent)](https://www.openpolicyagent.org/)
[![Vault](https://img.shields.io/badge/HashiCorp-Vault-FFEC6E?logo=hashicorp)](https://www.vaultproject.io/)
[![AWS](https://img.shields.io/badge/AWS-STS-FF9900?logo=amazonaws)](https://aws.amazon.com/)

[Live Demo](#) : [Architecture](./docs/architecture.md) : [Docs](./docs/) : [Report Bug](../../issues)

---

## Overview

**JIT IAM Portal** is a production grade reference implementation of a Zero Trust, Just In Time access management system for cloud infrastructure.

Static, long lived credentials such as permanent AWS IAM keys or hardcoded database passwords remain one of the largest attack vectors in modern cloud environments. A single compromised laptop or an accidentally committed secret can grant an attacker persistent access to production systems.

This project addresses that problem by enforcing a strict **Zero Standing Privileges (ZSP)** posture. No user holds permanent elevated access. When a legitimate operational need arises, such as investigating a production incident or applying a database patch, the engineer requests temporary, policy gated permissions through a self service portal. The system evaluates the request against corporate security policy, routes it through an approval workflow, issues short lived credentials via HashiCorp Vault and AWS STS, and revokes them automatically once the TTL expires.

A public **interactive sandbox mode** lets reviewers experience the full workflow live without requiring an AWS account or exposing any real infrastructure.

---

## Key Features

- **Zero Standing Privileges (ZSP)** : no permanent elevated credentials exist
- **Just In Time Access** : request, approve, use, auto revoke
- **Policy as Code** : authorization logic expressed in Open Policy Agent (Rego)
- **Ephemeral Credentials** : dynamic AWS STS keys brokered through HashiCorp Vault
- **Interactive Approval Workflow** : Slack and Teams style approval simulation
- **Immutable Audit Trail** : every lifecycle event logged, S3 Object Lock ready
- **Public Sandbox Demo** : one click personas for Engineer, Approver, and Auditor
- **In Browser Terminal** : execute simulated AWS CLI commands against issued credentials
- **Infrastructure as Code** : Terraform modules for VPC, ECS, RDS, S3, IAM, and ECR

---

## Architecture

```
                    ┌───────────────────────────────┐
                    │  Web Visitor / Hiring Manager │
                    └───────────────┬───────────────┘
                                    │ HTTPS
                                    ▼
                    ┌───────────────────────────────┐
                    │   Next.js Self Service Portal │
                    └───────────────┬───────────────┘
                                    │ REST
                                    ▼
                    ┌───────────────────────────────┐
                    │     FastAPI Orchestrator      │
                    └───┬───────────┬───────────┬───┘
                        │           │           │
                        ▼           ▼           ▼
                  ┌─────────┐ ┌──────────┐ ┌─────────────┐
                  │   OPA   │ │  Slack   │ │   Vault /   │
                  │ (Rego)  │ │Simulator │ │  AWS STS    │
                  └─────────┘ └──────────┘ └──────┬──────┘
                                                  │
                                                  ▼
                                          ┌───────────────┐
                                          │  S3 + Audit   │
                                          └───────────────┘
```

For a detailed component breakdown and sequence diagrams, see [`docs/architecture.md`](./docs/architecture.md).

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js (TypeScript), Tailwind CSS, Shadcn UI, React Query, Xterm.js |
| Backend | Python, FastAPI, SQLAlchemy, Alembic, Celery, Redis |
| Policy Engine | Open Policy Agent (Rego) |
| Secrets Broker | HashiCorp Vault (AWS Secrets Engine), AWS STS |
| Data Stores | PostgreSQL, Redis |
| Infrastructure | AWS ECS Fargate, RDS, S3, IAM, ECR, provisioned with Terraform |
| CI CD | GitHub Actions, Trivy, Checkov, Bandit, Gitleaks |
| Hosting | Vercel, Render, Neon (demo), AWS (production reference) |

---

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local frontend development)
- Python (for local backend development)

### Running Locally

```bash
git clone https://github.com/adityawaradkar/jit-iam-portal.git
cd jit-iam-portal
cp .env.example .env
docker compose --profile full up --build

--- 

### Trying the Demo

1. Log in as **Alex (Senior Backend Engineer)**.
2. Request **30 minutes** of access to `Production DB` with a business justification.
3. Switch to **Sarah (Security Lead)** and approve the request.
4. Switch back to **Alex** and copy the issued ephemeral STS credentials.
5. Observe the credentials expire automatically when the TTL elapses.

---

## Project Structure

```
jit-iam-portal/
├── backend/       # FastAPI orchestration service
├── frontend/      # Next.js self service portal
├── policies/      # OPA Rego policies (Policy as Code)
├── infra/         # Terraform IaC for AWS deployment
├── docs/          # Architecture, deployment guides, screenshots
└── docker-compose.yml
```

---

## Compliance Mapping

| Framework | Control | How This Project Satisfies It |
|---|---|---|
| SOC 2 Type II | CC6.1 Logical Access Controls | Enforces Zero Standing Privileges; all elevation requires authorization |
| ISO 27001 | A.9.2.3 Management of Privileged Access | Automates grant and revocation of privileged access via JIT principles |
| NIST SP 800 53 | AC 2 Account Management and Least Privilege | Restricts privileged credentials to temporary lifetimes with mandatory expiration |
| PCI DSS | Requirement 7 Restrict Access by Business Need | Scopes access to explicitly justified, time boxed operational windows |

---

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). This is primarily a portfolio project, but pull requests and issues are welcome.

## Security

Please read [`SECURITY.md`](./SECURITY.md) before reporting vulnerabilities.

## License

Released under the MIT License. See [`LICENSE`](./LICENSE).

## Author

**Aditya Waradkar**

- Portfolio : [@adityawaradkar](https://adityawaradkar-gamma.vercel.app/)
- LinkedIn : [in/adityawaradkar](https://www.linkedin.com/in/aditya-waradkar-9a03b92a5/)
