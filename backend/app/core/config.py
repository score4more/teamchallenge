from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Score4More API"
    SECRET_KEY: str = "your-secret-key-for-development"  # In production, use environment variable
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173"]
    
    # File upload settings
    UPLOAD_FOLDER: str = "uploads"
    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS: set = {"pdf"}

    class Config:
        case_sensitive = True

settings = Settings()

# Create upload folder if it doesn't exist
os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True) 