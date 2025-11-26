"""Routers package initialization."""

from app.routers.auth import router as auth_router
from app.routers.projects import router as projects_router
from app.routers.demo import router as demo_router

__all__ = ["auth_router", "projects_router", "demo_router"]
