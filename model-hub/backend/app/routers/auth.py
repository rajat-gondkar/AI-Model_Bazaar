"""
Authentication routes for user registration, login, and profile.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from bson import ObjectId

from app.database import mongodb
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import auth_service
from app.utils.dependencies import get_current_user, get_current_active_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user (creator).
    
    - **email**: Valid email address (must be unique)
    - **username**: Username (3-50 characters, must be unique)
    - **password**: Password (minimum 8 characters)
    """
    users_collection = mongodb.get_collection("users")
    
    # Check if email already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = await users_collection.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Hash password
    hashed_password = auth_service.hash_password(user_data.password)
    
    # Create user document
    user_doc = {
        "email": user_data.email,
        "username": user_data.username,
        "hashed_password": hashed_password,
        "is_active": True,
        "is_creator": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert into database
    result = await users_collection.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    return UserResponse(
        id=str(result.inserted_id),
        email=user_doc["email"],
        username=user_doc["username"],
        is_active=user_doc["is_active"],
        is_creator=user_doc["is_creator"],
        created_at=user_doc["created_at"]
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """
    Login with email and password.
    
    Returns a JWT access token on successful authentication.
    """
    users_collection = mongodb.get_collection("users")
    
    # Find user by email
    user = await users_collection.find_one({"email": credentials.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not auth_service.verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create access token
    access_token = auth_service.create_user_token(
        user_id=str(user["_id"]),
        email=user["email"]
    )
    
    user_response = UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        username=user["username"],
        is_active=user["is_active"],
        is_creator=user.get("is_creator", True),
        created_at=user["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    """
    Get the current authenticated user's information.
    
    Requires a valid JWT token in the Authorization header.
    """
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        username=current_user["username"],
        is_active=current_user["is_active"],
        is_creator=current_user.get("is_creator", True),
        created_at=current_user["created_at"]
    )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout the current user.
    
    Note: Since we're using stateless JWT tokens, this endpoint
    just returns a success message. The client should discard the token.
    For production, consider implementing token blacklisting.
    """
    return {"message": "Successfully logged out"}
