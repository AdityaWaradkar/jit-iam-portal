# Contributing to JIT IAM Portal

Thanks for your interest! This is primarily a portfolio project, but contributions are welcome.

## Development Workflow

1. Fork the repo and create a branch: `git checkout -b feat/short-description`
2. Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` new feature
   - `fix:` bug fix
   - `chore:` tooling, deps
   - `docs:` documentation
   - `refactor:` code change with no behavior change
   - `test:` adding or fixing tests
3. Run linters before pushing:
   - Backend: `ruff check . && mypy .`
   - Frontend: `npm run lint && npm run typecheck`
4. Open a Pull Request using the provided template.

## Code Style

- **Python:** enforced by `ruff` + `black` (line length 100)
- **TypeScript:** enforced by `eslint` + `prettier`
- **Rego:** formatted with `opa fmt`
- **Terraform:** formatted with `terraform fmt`

## Reporting Issues

Use the issue templates in `.github/ISSUE_TEMPLATE/`.