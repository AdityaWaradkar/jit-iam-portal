<div align="center">

# 🛡️ JIT IAM Portal

### Zero-Trust Ephemeral Access & Just-In-Time Cloud IAM Portal

**Eliminate static credentials. Enforce Zero Standing Privileges. Grant access only when needed — and revoke it automatically.**

[![CI](https://github.com/<YOUR_USERNAME>/jit-iam-portal/actions/workflows/ci.yml/badge.svg)](https://github.com/<YOUR_USERNAME>/jit-iam-portal/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![OPA](https://img.shields.io/badge/OPA-Rego-7D9199?logo=openpolicyagent)](https://www.openpolicyagent.org/)
[![Vault](https://img.shields.io/badge/HashiCorp-Vault-FFEC6E?logo=hashicorp)](https://www.vaultproject.io/)
[![AWS](https://img.shields.io/badge/AWS-STS-FF9900?logo=amazonaws)](https://aws.amazon.com/)

[**🚀 Live Demo**](#) · [**📐 Architecture**](./docs/architecture.md) · [**📖 Docs**](./docs/) · [**🐛 Report Bug**](../../issues)

</div>

---

## 📌 Overview

**JIT IAM Portal** is a production-grade reference implementation of a **Zero-Trust, Just-In-Time (JIT) access management system** for cloud infrastructure.

Instead of engineers holding permanent AWS admin keys or static database passwords, all users start with **Zero Standing Privileges (ZSP)**. When a real operational need arises — a production incident, a database patch — they request **short-lived, policy-gated, ephemeral credentials** through a self-service portal. Those credentials are issued by HashiCorp Vault + AWS STS, scoped tightly to the request, and revoked automatically when the TTL expires.

The project includes a **public interactive sandbox mode** so recruiters, hiring managers, and engineers can experience the full workflow live — no AWS account required.

---

## ✨ Features

- 🔐 **Zero Standing Privileges (ZSP)** — no permanent elevated credentials, ever
- ⏱️ **Just-In-Time Access** — request → approve → use → auto-revoke
- 📜 **Policy as Code** — authorization logic in Open Policy Agent (Rego)
- 🎫 **Ephemeral Credentials** — dynamic AWS STS keys via HashiCorp Vault
- 💬 **Interactive Approvals** — Slack/Teams-style workflow simulator
- 🧾 **Immutable Audit Trail** — every event logged, S3 Object Lock-ready
- 🧪 **Public Sandbox Demo** — 1-click personas: Engineer / Approver / Auditor
- 🖥️ **In-Browser Terminal** — test real (sandboxed) AWS CLI commands
- ☁️ **Full IaC** — Terraform for VPC, ECS, RDS, S3, IAM, ECR

---

## 🏗️ Architecture

```
                    ┌───────────────────────────────┐
                    │  Web Visitor / Hiring Manager │
                    └───────────────┬───────────────┘
                                    │ HTTPS
                                    ▼
                    ┌───────────────────────────────┐
                    │   Next.js Self-Service Portal │
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

Full diagram and mechanics → [`docs/architecture.md`](./docs/architecture.md)

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (TypeScript), Tailwind CSS, Shadcn UI, React Query, Xterm.js |
| Backend | Python 3.12, FastAPI, SQLAlchemy, Alembic, Celery/Redis |
| Policy | Open Policy Agent (Rego) |
| Secrets | HashiCorp Vault (AWS Secrets Engine) + AWS STS |
| Data | PostgreSQL, Redis |
| Infra | AWS ECS Fargate, RDS, S3, IAM, ECR — provisioned with Terraform |
| CI/CD | GitHub Actions, Trivy, Checkov, Bandit, Gitleaks |
| Hosting | Vercel / Render / Neon (demo), AWS (production reference) |

---

## 🚀 Quick Start

### Prerequisites
- Docker + Docker Compose
- Node.js 20+ (for local frontend dev)
- Python 3.12+ (for local backend dev)

### Run locally

```bash
git clone https://github.com/<YOUR_USERNAME>/jit-iam-portal.git
cd jit-iam-portal
cp .env.example .env
docker compose up --build
```

Then open:
- Frontend → http://localhost:3000
- Backend docs → http://localhost:8000/docs

### Try the demo
1. Log in as **Alex (Senior Backend Engineer)**
2. Request **30 min** of `Production-DB` access with a justification
3. Switch to **Sarah (Security Lead)** → Approve the request
4. Switch back to **Alex** → copy your ephemeral STS credentials
5. Watch them auto-expire in real time

---

## 📁 Project Structure

```
jit-iam-portal/
├── backend/       # FastAPI orchestration service
├── frontend/      # Next.js self-service portal
├── policies/      # OPA Rego policies (Policy as Code)
├── infra/         # Terraform IaC for AWS deployment
├── docs/          # Architecture, deployment, screenshots
└── docker-compose.yml
```

---

## 🛡️ Compliance Mapping

| Framework | Control | How JIT IAM Portal satisfies it |
|---|---|---|
| SOC 2 Type II | CC6.1 — Logical Access | ZSP enforced; all elevation requires authorization |
| ISO 27001 | A.9.2.3 — Privileged Access | Automated JIT grant + auto-revoke |
| NIST SP 800-53 | AC-2 — Least Privilege | Temporary creds with mandatory expiration |
| PCI-DSS 4.0 | Req. 7 — Need-to-Know | Access scoped to justified, time-boxed windows |

---

## 🗺️ Roadmap

- [x] **Section 1** — Repo scaffolding & docs
- [ ] **Section 2** — FastAPI backend skeleton
- [ ] **Section 3** — Next.js frontend skeleton
- [ ] **Section 4** — Docker Compose local stack
- [ ] **Section 5** — DB schema + seed data
- [ ] … (see [`docs/roadmap.md`](./docs/roadmap.md))

---

## 🤝 Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). This is primarily a portfolio project but PRs and issues are welcome.

## 🔐 Security

Please read [`SECURITY.md`](./SECURITY.md) before reporting vulnerabilities.

## 📄 License

MIT — see [`LICENSE`](./LICENSE).

## 👤 Author

**<YOUR NAME>**
- GitHub: [@adityawaradkar](https://github.com/AdityaWaradkar)
- LinkedIn: [in/<YOUR_HANDLE>](https://linkedin.com/in/<YOUR_HANDLE>)