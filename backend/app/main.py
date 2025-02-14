from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import route_listeners
from app.models.database import engine
from app.models import database_models

app = FastAPI(title="Code Challenge API")
database_models.Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(route_listeners.app)