from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


# Create the database tables
def init_db():
    from .models import Base
    Base.metadata.create_all(bind=engine)
