from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from ....core.auth import create_access_token, DEMO_USER, oauth2_scheme
from ....core.config import settings
import jwt
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenValidationResponse(BaseModel):
    valid: bool
    message: str = None
    expires_at: str = None
    remaining_minutes: float = None

router = APIRouter(
    tags=["auth"],
    responses={
        401: {"description": "Authentication failed"},
        403: {"description": "Permission denied"},
        404: {"description": "Not found"}
    }
)

@router.post(
    "/login", 
    response_model=Token,
    summary="Login to get access token",
    description="Authenticate and receive a JWT token for API access"
)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login endpoint to authenticate users and provide access tokens.
    
    For demo purposes:
    - Username: demo@example.com
    - Password: demo123
    """
    if form_data.username != DEMO_USER["username"] or form_data.password != DEMO_USER["hashed_password"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": form_data.username},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get(
    "/validate-token", 
    response_model=TokenValidationResponse,
    summary="Validate JWT Token",
    description="Check if the provided JWT token is valid and get expiration information"
)
async def validate_token(token: str = Depends(oauth2_scheme)):
    """
    Validates the JWT token and returns information about its validity and expiration.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        exp_timestamp = payload.get("exp")
        
        if exp_timestamp is None:
            return {"valid": False, "message": "Token has no expiration date"}
        
        # Convert to datetime
        expiration_datetime = datetime.fromtimestamp(exp_timestamp)
        current_datetime = datetime.utcnow()
        
        # Calculate remaining time
        remaining_time = expiration_datetime - current_datetime
        remaining_minutes = remaining_time.total_seconds() / 60
        
        if current_datetime < expiration_datetime:
            return {
                "valid": True, 
                "expires_at": expiration_datetime.isoformat(),
                "remaining_minutes": round(remaining_minutes, 2)
            }
        else:
            return {"valid": False, "message": "Token has expired"}
            
    except jwt.ExpiredSignatureError:
        return {"valid": False, "message": "Token has expired"}
    except jwt.PyJWTError:
        return {"valid": False, "message": "Invalid token"} 