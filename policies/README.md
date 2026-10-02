# Policies — OPA / Rego

Authorization logic as code. **Implemented in Section 8.**

Example rules:
- Staging/Dev ≤ 2h → auto-approve
- Production → manual approval
- Duration > 4h → reject
- Off-hours without incident ticket → reject