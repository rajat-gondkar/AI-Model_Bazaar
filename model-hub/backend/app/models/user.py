"""
User document model for MongoDB.
Defines the structure of user documents in the database.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional
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


class UserModel(BaseModel):
    """User document model."""
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    email: EmailStr
    username: str
    hashed_password: str
    is_active: bool = True
    is_creator: bool = True
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
                "email": "user@example.com",
                "username": "johndoe",
                "hashed_password": "hashed_password_here",
                "is_active": True,
                "is_creator": True
            }
        }


class UserInDB(UserModel):
    """User model as stored in database (with password hash)."""
    pass


class UserPublic(BaseModel):
    """Public user information (no password)."""
    
    id: str
    email: EmailStr
    username: str
    is_active: bool
    is_creator: bool
    created_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
