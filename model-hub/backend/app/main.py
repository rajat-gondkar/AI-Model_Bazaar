"""
Model Hub API - Main FastAPI Application

A platform for hosting and launching AI model demos with Streamlit frontends.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import mongodb
from app.routers import auth_router, projects_router, demo_router

# Configure logging - Always show INFO level for debugging
logging.basicConfig(
    level=logging.INFO,  # Always INFO for better debugging
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)

# Set specific loggers to INFO level for detailed debugging
logging.getLogger("app.services.demo_launcher").setLevel(logging.INFO)
logging.getLogger("app.services.s3_service").setLevel(logging.INFO)
logging.getLogger("app.services.archive_service").setLevel(logging.INFO)
logging.getLogger("app.routers.demo").setLevel(logging.INFO)
logging.getLogger("app.routers.projects").setLevel(logging.INFO)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting Model Hub API...")
    logger.info(f"Demo environments path: {settings.demo_environments_path}")
    logger.info(f"S3 Bucket: {settings.s3_bucket_name}")
    logger.info(f"Demo ports: {settings.demo_port_start}-{settings.demo_port_end}")
    
    # Ensure demo environments directory exists
    import os
    os.makedirs(settings.demo_environments_path, exist_ok=True)
    
    await mongodb.connect()
    logger.info("Model Hub API started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Model Hub API...")
    await mongodb.disconnect()
    logger.info("Model Hub API shut down")


# Create FastAPI application
app = FastAPI(
    title="Model Hub API",
    description="""
## Model Hub + Demo Launcher

A platform for AI model creators to share their projects and for users to try interactive demos.

### Features:
- **Upload** AI projects with Streamlit frontends
- **Browse** a gallery of models with search and filtering
- **Launch** interactive demos on-demand

### User Roles:
- **Creators**: Upload and manage AI projects
- **Testers**: Browse and launch demos

### API Sections:
- **Authentication**: User registration and login
- **Projects**: Upload, list, and manage projects
- **Demo**: Launch and control demo instances
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(demo_router)


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - API information."""
    return {
        "name": "Model Hub API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    
    Returns the current status of the API and its dependencies.
    """
    db_status = "connected" if mongodb.database is not None else "disconnected"
    
    return {
        "status": "healthy",
        "database": db_status,
        "version": "1.0.0"
    }


@app.get("/api/stats", tags=["Health"])
async def get_stats():
    """
    Get API statistics.
    
    Returns counts of users and projects.
    """
    try:
        users_count = await mongodb.get_collection("users").count_documents({})
        projects_count = await mongodb.get_collection("projects").count_documents({})
        running_demos = await mongodb.get_collection("projects").count_documents({"status": "running"})
        
        return {
            "total_users": users_count,
            "total_projects": projects_count,
            "running_demos": running_demos
        }
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return {
            "total_users": 0,
            "total_projects": 0,
            "running_demos": 0,
            "error": "Could not fetch statistics"
        }


# Run with: uvicorn app.main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
