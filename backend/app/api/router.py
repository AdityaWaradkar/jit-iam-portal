from fastapi import APIRouter

from app.api.v1 import (
    access,
    access_issue,
    admin,
    approver,
    audit,
    auth,
    dashboard,
    demo,
    health,
    leases,
    security,
    terminal,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(access.router)
api_router.include_router(access_issue.router)
api_router.include_router(approver.router)
api_router.include_router(dashboard.router)
api_router.include_router(leases.router)
api_router.include_router(admin.router)
api_router.include_router(terminal.router)
api_router.include_router(audit.router)
api_router.include_router(security.router)
api_router.include_router(demo.router)