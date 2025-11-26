"""
User request/response schemas.
Pydantic models for API validation.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    """Schema for user registration."""
    
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=100)
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "creator@example.com",
                "username": "johndoe",
                "password": "securepassword123"
            }
        }


class UserLogin(BaseModel):
    """Schema for user login."""
    
    email: EmailStr
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "creator@example.com",
                "password": "securepassword123"
            }
        }


class UserResponse(BaseModel):
    """Schema for user response (public info)."""
    
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
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "email": "creator@example.com",
                "username": "johndoe",
                "is_active": True,
                "is_creator": True,
                "created_at": "2025-11-26T10:00:00Z"
            }
        }


class TokenResponse(BaseModel):
    """Schema for token response after login."""
    
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "507f1f77bcf86cd799439011",
                    "email": "creator@example.com",
                    "username": "johndoe",
                    "is_active": True,
                    "is_creator": True,
                    "created_at": "2025-11-26T10:00:00Z"
                }
            }
        }


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "newusername",
                "email": "newemail@example.com"
            }
        }
