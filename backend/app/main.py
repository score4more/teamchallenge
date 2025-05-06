from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
from .core.config import settings
from .api.v1.endpoints import auth, pdf
from .database import engine
from .models import pdf as pdf_models

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for PDF processing and search with authentication",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Create database tables
pdf_models.Base.metadata.create_all(bind=engine)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(pdf.router, prefix=f"{settings.API_V1_STR}/pdf", tags=["pdf"])

@app.get("/health", tags=["status"])
async def health_check():
    return {"status": "ok"}

def run():
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 