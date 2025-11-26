"""
Project document model for MongoDB.
Defines the structure of project documents in the database.
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic models."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class ProjectFiles(BaseModel):
    """Structure for project files information."""
    
    app_file: str = "app.py"  # Main Streamlit entry point
    model_files: List[str] = []  # Model files (.pkl, .pt, etc.)
    requirements_file: str = "requirements.txt"
    other_files: List[str] = []  # Any other files in the bundle
    
    class Config:
        protected_namespaces = ()  # Disable protected namespace warning
    

class ProjectModel(BaseModel):
    """Project document model."""
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    description: str
    tags: List[str] = []
    author_name: str
    github_url: Optional[str] = None
    created_by: PyObjectId  # Reference to User
    s3_path: str  # S3 path prefix: projects/{project_id}/
    files: ProjectFiles = Field(default_factory=ProjectFiles)
    status: str = "pending"  # pending, ready, running, error
    demo_url: Optional[str] = None
    demo_port: Optional[int] = None
    demo_pid: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "name": "Image Classifier",
                "description": "A CNN model for image classification",
                "tags": ["computer-vision", "classification"],
                "author_name": "John Doe",
                "github_url": "https://github.com/johndoe/classifier",
                "status": "ready"
            }
        }


class ProjectStatus:
    """Project status constants."""
    
    PENDING = "pending"
    READY = "ready"
    LAUNCHING = "launching"
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"
