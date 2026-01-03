"""
Configuration settings for the Model Hub backend.
Loads environment variables and provides typed settings.
"""

from pydantic_settings import BaseSettings
from typing import List
import os
import tempfile

# Get the absolute path to the backend directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Use a directory OUTSIDE the backend folder to avoid uvicorn reload issues
# This ensures file changes in demo environments don't trigger server reloads
DEFAULT_DEMO_ENV_PATH = os.path.join(tempfile.gettempdir(), "model-hub-demos")


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # MongoDB Configuration
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "model_hub"
    
    # JWT Configuration
    jwt_secret_key: str = "your-super-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours
    
    # AWS Configuration
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket_name: str = "model-hub-projects"
    
    # Demo Configuration
    demo_base_url: str = "http://localhost"
    demo_environments_path: str = DEFAULT_DEMO_ENV_PATH
    demo_port_start: int = 8501
    demo_port_end: int = 8600
    
    # File Upload Configuration
    max_upload_size_mb: int = 500
    allowed_extensions: str = ".py,.pkl,.pt,.h5,.onnx,.txt,.json,.csv,.png,.jpg,.jpeg,.gif,.pth,.pb,.weights"
    
    # CORS Configuration
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        """Return allowed extensions as a list."""
        return [ext.strip() for ext in self.allowed_extensions.split(",")]
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Return CORS origins as a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def max_upload_size_bytes(self) -> int:
        """Return max upload size in bytes."""
        return self.max_upload_size_mb * 1024 * 1024
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()
