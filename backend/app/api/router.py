from fastapi import APIRouter

from app.api.v1 import access, access_actions, auth, dashboard, demo, health

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(access.router)
api_router.include_router(access_actions.router)
api_router.include_router(dashboard.router)
api_router.include_router(demo.router)