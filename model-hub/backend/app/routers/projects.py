"""
Project routes for upload, listing, and management.
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import os
import tempfile

from app.database import mongodb
from app.schemas.project import (
    ProjectCreate, 
    ProjectResponse, 
    ProjectListResponse, 
    ProjectListItem,
    ProjectFilesResponse
)
from app.services.s3_service import s3_service
from app.services.archive_service import archive_service
from app.utils.dependencies import get_current_active_user, get_optional_user
from app.utils.validators import validate_archive_extension, validate_file_size
from app.config import settings

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.post("/upload", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def upload_project(
    name: str = Form(..., min_length=3, max_length=100),
    description: str = Form(..., min_length=10, max_length=2000),
    tags: str = Form(default=""),
    author_name: str = Form(..., min_length=2, max_length=100),
    github_url: Optional[str] = Form(default=None),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Upload a new AI project.
    
    Upload a ZIP file containing:
    - app.py (or main.py/streamlit_app.py) - Streamlit entry point
    - requirements.txt - Python dependencies
    - Model files (.pkl, .pt, .h5, etc.)
    - Any additional files needed
    
    Form fields:
    - **name**: Project name (3-100 characters)
    - **description**: Project description (10-2000 characters)
    - **tags**: Comma-separated tags
    - **author_name**: Author's name
    - **github_url**: Optional GitHub repository URL
    - **file**: ZIP file containing the project
    """
    # Validate file extension
    is_valid, error = validate_archive_extension(file.filename or "")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file size
    is_valid, error = validate_file_size(len(content))
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    
    # Create temporary directory for extraction
    temp_dir = archive_service.get_temp_dir()
    archive_path = os.path.join(temp_dir, "upload.zip")
    extracted_path = os.path.join(temp_dir, "extracted")
    
    try:
        # Save uploaded file temporarily
        with open(archive_path, "wb") as f:
            f.write(content)
        
        # Extract archive
        success, error = archive_service.extract_archive(archive_path, extracted_path)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error
            )
        
        # Validate bundle contents
        is_valid, error, file_info = archive_service.validate_bundle(extracted_path)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error
            )
        
        # Parse tags
        tags_list = [tag.strip().lower() for tag in tags.split(",") if tag.strip()]
        
        # Create project document
        projects_collection = mongodb.get_collection("projects")
        
        project_doc = {
            "name": name,
            "description": description,
            "tags": tags_list,
            "author_name": author_name,
            "github_url": github_url,
            "created_by": current_user["_id"],
            "s3_path": "",  # Will be updated after upload
            "files": {
                "app_file": file_info["app_file"],
                "model_files": file_info["model_files"],
                "requirements_file": file_info["requirements_file"],
                "other_files": file_info["other_files"]
            },
            "status": "pending",
            "demo_url": None,
            "demo_port": None,
            "demo_pid": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert project to get ID
        result = await projects_collection.insert_one(project_doc)
        project_id = str(result.inserted_id)
        
        # Upload files to S3
        s3_prefix = f"projects/{project_id}"
        uploaded_keys = await s3_service.upload_directory(extracted_path, s3_prefix)
        
        if not uploaded_keys:
            # Rollback: delete project document
            await projects_collection.delete_one({"_id": result.inserted_id})
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload files to storage"
            )
        
        # Update project with S3 path and status
        await projects_collection.update_one(
            {"_id": result.inserted_id},
            {
                "$set": {
                    "s3_path": s3_prefix,
                    "status": "ready",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return ProjectResponse(
            id=project_id,
            name=name,
            description=description,
            tags=tags_list,
            author_name=author_name,
            github_url=github_url,
            created_by=str(current_user["_id"]),
            s3_path=s3_prefix,
            files=ProjectFilesResponse(**file_info),
            status="ready",
            demo_url=None,
            created_at=project_doc["created_at"],
            updated_at=project_doc["updated_at"]
        )
        
    finally:
        # Cleanup temporary files
        archive_service.cleanup_temp_dir(temp_dir)


@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    search: Optional[str] = None,
    tags: Optional[str] = None,
    author: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 10
):
    """
    List all projects with optional filters.
    
    Query parameters:
    - **search**: Search in name and description
    - **tags**: Comma-separated tags to filter by
    - **author**: Filter by author name
    - **status**: Filter by status (pending, ready, running, error)
    - **page**: Page number (default: 1)
    - **per_page**: Items per page (default: 10, max: 50)
    """
    projects_collection = mongodb.get_collection("projects")
    
    # Build query
    query = {}
    
    if search:
        query["$text"] = {"$search": search}
    
    if tags:
        tags_list = [tag.strip().lower() for tag in tags.split(",")]
        query["tags"] = {"$in": tags_list}
    
    if author:
        query["author_name"] = {"$regex": author, "$options": "i"}
    
    if status:
        query["status"] = status
    
    # Pagination
    per_page = min(per_page, 50)  # Max 50 items per page
    skip = (page - 1) * per_page
    
    # Get total count
    total = await projects_collection.count_documents(query)
    
    # Get projects
    cursor = projects_collection.find(query).sort("created_at", -1).skip(skip).limit(per_page)
    projects = await cursor.to_list(length=per_page)
    
    # Format response
    project_items = [
        ProjectListItem(
            id=str(p["_id"]),
            name=p["name"],
            description=p["description"][:200] + "..." if len(p["description"]) > 200 else p["description"],
            tags=p["tags"],
            author_name=p["author_name"],
            status=p["status"],
            created_at=p["created_at"]
        )
        for p in projects
    ]
    
    pages = (total + per_page - 1) // per_page  # Ceiling division
    
    return ProjectListResponse(
        projects=project_items,
        total=total,
        page=page,
        pages=pages,
        per_page=per_page
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """
    Get detailed information about a specific project.
    
    Path parameters:
    - **project_id**: The project's unique ID
    """
    projects_collection = mongodb.get_collection("projects")
    
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
    
    return ProjectResponse(
        id=str(project["_id"]),
        name=project["name"],
        description=project["description"],
        tags=project["tags"],
        author_name=project["author_name"],
        github_url=project.get("github_url"),
        created_by=str(project["created_by"]),
        s3_path=project["s3_path"],
        files=ProjectFilesResponse(**project["files"]),
        status=project["status"],
        demo_url=project.get("demo_url"),
        created_at=project["created_at"],
        updated_at=project["updated_at"]
    )


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Delete a project.
    
    Only the project owner can delete it.
    """
    projects_collection = mongodb.get_collection("projects")
    
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
            detail="You don't have permission to delete this project"
        )
    
    # Delete from S3
    await s3_service.delete_project(project_id)
    
    # Delete from database
    await projects_collection.delete_one({"_id": ObjectId(project_id)})
    
    return {"message": "Project deleted successfully"}


@router.get("/my-projects", response_model=ProjectListResponse)
async def get_my_projects(
    page: int = 1,
    per_page: int = 10,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get all projects created by the current user.
    """
    projects_collection = mongodb.get_collection("projects")
    
    query = {"created_by": current_user["_id"]}
    
    # Pagination
    per_page = min(per_page, 50)
    skip = (page - 1) * per_page
    
    # Get total count
    total = await projects_collection.count_documents(query)
    
    # Get projects
    cursor = projects_collection.find(query).sort("created_at", -1).skip(skip).limit(per_page)
    projects = await cursor.to_list(length=per_page)
    
    # Format response
    project_items = [
        ProjectListItem(
            id=str(p["_id"]),
            name=p["name"],
            description=p["description"][:200] + "..." if len(p["description"]) > 200 else p["description"],
            tags=p["tags"],
            author_name=p["author_name"],
            status=p["status"],
            created_at=p["created_at"]
        )
        for p in projects
    ]
    
    pages = (total + per_page - 1) // per_page
    
    return ProjectListResponse(
        projects=project_items,
        total=total,
        page=page,
        pages=pages,
        per_page=per_page
    )
