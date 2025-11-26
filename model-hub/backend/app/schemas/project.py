"""
Project request/response schemas.
Pydantic models for API validation.
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime


class ProjectCreate(BaseModel):
    """Schema for project creation (form data from frontend)."""
    
    name: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=10, max_length=2000)
    tags: str = Field(default="")  # Comma-separated tags
    author_name: str = Field(..., min_length=2, max_length=100)
    github_url: Optional[str] = None
    
    @property
    def tags_list(self) -> List[str]:
        """Convert comma-separated tags to list."""
        if not self.tags:
            return []
        return [tag.strip().lower() for tag in self.tags.split(",") if tag.strip()]
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Image Classifier",
                "description": "A CNN model for classifying images into 10 categories using deep learning",
                "tags": "computer-vision, classification, cnn",
                "author_name": "John Doe",
                "github_url": "https://github.com/johndoe/image-classifier"
            }
        }


class ProjectFilesResponse(BaseModel):
    """Schema for project files information."""
    
    app_file: str
    model_files: List[str]
    requirements_file: str
    other_files: List[str]


class ProjectResponse(BaseModel):
    """Schema for project response."""
    
    id: str
    name: str
    description: str
    tags: List[str]
    author_name: str
    github_url: Optional[str]
    created_by: str
    s3_path: str
    files: ProjectFilesResponse
    status: str
    demo_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439012",
                "name": "Image Classifier",
                "description": "A CNN model for classifying images",
                "tags": ["computer-vision", "classification", "cnn"],
                "author_name": "John Doe",
                "github_url": "https://github.com/johndoe/image-classifier",
                "created_by": "507f1f77bcf86cd799439011",
                "s3_path": "projects/507f1f77bcf86cd799439012/",
                "files": {
                    "app_file": "app.py",
                    "model_files": ["model.pkl"],
                    "requirements_file": "requirements.txt",
                    "other_files": []
                },
                "status": "ready",
                "demo_url": None,
                "created_at": "2025-11-26T10:30:00Z",
                "updated_at": "2025-11-26T10:30:00Z"
            }
        }


class ProjectListItem(BaseModel):
    """Schema for project in list view (condensed)."""
    
    id: str
    name: str
    description: str
    tags: List[str]
    author_name: str
    status: str
    created_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ProjectListResponse(BaseModel):
    """Schema for paginated project list response."""
    
    projects: List[ProjectListItem]
    total: int
    page: int
    pages: int
    per_page: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "projects": [
                    {
                        "id": "507f1f77bcf86cd799439012",
                        "name": "Image Classifier",
                        "description": "A CNN model for classifying images",
                        "tags": ["computer-vision", "classification"],
                        "author_name": "John Doe",
                        "status": "ready",
                        "created_at": "2025-11-26T10:30:00Z"
                    }
                ],
                "total": 1,
                "page": 1,
                "pages": 1,
                "per_page": 10
            }
        }


class DemoLaunchResponse(BaseModel):
    """Schema for demo launch response."""
    
    status: str
    message: str
    demo_url: Optional[str] = None
    estimated_time: Optional[int] = None  # seconds
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "launching",
                "message": "Demo is being prepared...",
                "demo_url": None,
                "estimated_time": 30
            }
        }


class DemoStatusResponse(BaseModel):
    """Schema for demo status response."""
    
    status: str  # launching, running, stopped, error
    demo_url: Optional[str] = None
    message: Optional[str] = None
    started_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "status": "running",
                "demo_url": "http://ec2-xx-xx-xx-xx.compute.amazonaws.com:8501",
                "message": "Demo is running",
                "started_at": "2025-11-26T10:35:00Z"
            }
        }
