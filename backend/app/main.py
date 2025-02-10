from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional
import jwt

SECRET_KEY = "your-secret-key-for-development"  # In production, use environment variable
ALGORITHM = "HS256"

app = FastAPI(title="Code Challenge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# For demo purposes - in real app this would be in a database
DEMO_USER = {
    "username": "demo@example.com",
    "hashed_password": "demo123"  # In real app, this would be properly hashed
}

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    return username

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Demo authentication - in real app, verify against database
    if form_data.username != DEMO_USER["username"] or form_data.password != DEMO_USER["hashed_password"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": form_data.username},
        expires_delta=timedelta(minutes=30)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/protected")
async def protected_route(current_user: str = Depends(get_current_user)):
    return {"message": "This is a protected route", "user": current_user} 