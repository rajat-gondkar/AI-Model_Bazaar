"""
Demo routes for launching, checking status, and stopping demos.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from bson import ObjectId

from app.database import mongodb
from app.schemas.project import DemoLaunchResponse, DemoStatusResponse
from app.services.demo_launcher import demo_launcher
from app.utils.dependencies import get_current_active_user, get_optional_user

router = APIRouter(prefix="/api/demo", tags=["Demo"])


@router.post("/{project_id}/launch", response_model=DemoLaunchResponse)
async def launch_demo(project_id: str):
    """
    Launch a Streamlit demo for a project.
    
    This will:
    1. Download project files from S3 (if not already cached)
    2. Create a virtual environment with the project's dependencies
    3. Start the Streamlit app on an available port
    4. Return the demo URL
    
    Path parameters:
    - **project_id**: The project's unique ID
    """
    projects_collection = mongodb.get_collection("projects")
    
    # Get project
    try:
        project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID format"
        )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if project is ready
    if project["status"] == "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project is still being processed"
        )
    
    if project["status"] == "error":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project has an error and cannot be launched"
        )
    
    # Check if already running
    demo_status = demo_launcher.get_demo_status(project_id)
    if demo_status["status"] == "running":
        return DemoLaunchResponse(
            status="running",
            message="Demo is already running",
            demo_url=demo_status["demo_url"]
        )
    
    # Launch the demo
    app_file = project["files"].get("app_file", "app.py")
    success, message, demo_url, port = await demo_launcher.launch_demo(project_id, app_file)
    
    if not success:
        # Update project status to error
        await projects_collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": {"status": "error", "updated_at": datetime.utcnow()}}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )
    
    # Update project with demo info
    await projects_collection.update_one(
        {"_id": ObjectId(project_id)},
        {
            "$set": {
                "status": "running",
                "demo_url": demo_url,
                "demo_port": port,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return DemoLaunchResponse(
        status="launching",
        message="Demo is starting up. Please wait a few seconds...",
        demo_url=demo_url,
        estimated_time=10
    )


@router.get("/{project_id}/status", response_model=DemoStatusResponse)
async def get_demo_status(project_id: str):
    """
    Get the current status of a demo.
    
    Path parameters:
    - **project_id**: The project's unique ID
    
    Returns:
    - **status**: Current status (stopped, launching, running, error)
    - **demo_url**: URL to access the demo (if running)
    - **started_at**: When the demo was started
    """
    projects_collection = mongodb.get_collection("projects")
    
    # Verify project exists
    try:
        project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID format"
        )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get demo status
    status_info = demo_launcher.get_demo_status(project_id)
    
    # If demo stopped but project still shows running, update project
    if status_info["status"] == "stopped" and project.get("status") == "running":
        await projects_collection.update_one(
            {"_id": ObjectId(project_id)},
            {
                "$set": {
                    "status": "ready",
                    "demo_url": None,
                    "demo_port": None,
                    "demo_pid": None,
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    started_at = None
    if status_info.get("started_at"):
        started_at = datetime.fromisoformat(status_info["started_at"])
    
    return DemoStatusResponse(
        status=status_info["status"],
        demo_url=status_info.get("demo_url"),
        message=status_info.get("message"),
        started_at=started_at
    )


@router.post("/{project_id}/stop")
async def stop_demo(
    project_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Stop a running demo.
    
    Only the project owner can stop the demo.
    
    Path parameters:
    - **project_id**: The project's unique ID
    """
    projects_collection = mongodb.get_collection("projects")
    
    # Get project
    try:
        project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID format"
        )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check ownership
    if str(project["created_by"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to stop this demo"
        )
    
    # Stop the demo
    success, message = await demo_launcher.stop_demo(project_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Update project status
    await projects_collection.update_one(
        {"_id": ObjectId(project_id)},
        {
            "$set": {
                "status": "ready",
                "demo_url": None,
                "demo_port": None,
                "demo_pid": None,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Demo stopped successfully"}


@router.post("/{project_id}/cleanup")
async def cleanup_demo_environment(
    project_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Clean up the demo environment (remove venv and cached files).
    
    Only the project owner can clean up the environment.
    This is useful to free up disk space or force a fresh environment on next launch.
    """
    projects_collection = mongodb.get_collection("projects")
    
    # Get project
    try:
        project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID format"
        )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check ownership
    if str(project["created_by"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to clean up this environment"
        )
    
    # Cleanup
    success = await demo_launcher.cleanup_environment(project_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clean up environment"
        )
    
    return {"message": "Environment cleaned up successfully"}
