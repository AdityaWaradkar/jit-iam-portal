from fastapi import APIRouter

from app.api.v1 import (
    access,
    approver,
    auth,
    dashboard,
    demo,
    health,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(access.router)
api_router.include_router(approver.router)
api_router.include_router(dashboard.router)
api_router.include_router(demo.router)