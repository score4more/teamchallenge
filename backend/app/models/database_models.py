from sqlalchemy import Column, DateTime, Integer, String, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.database import Base


class PDFMetaData(Base):
    __tablename__ = "pdf_metadata"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    total_pages = Column(Integer)
    size = Column(Float)
    upload_date = Column(DateTime)
    uploaded_by = Column(String)

    chunks = relationship("PDFChunk", back_populates="pdf")


class PDFChunk(Base):
    __tablename__ = "pdf_chunks"

    id = Column(Integer, primary_key=True, index=True)
    pdf_id = Column(Integer, ForeignKey("pdf_metadata.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)

    pdf = relationship("PDFMetaData", back_populates="chunks")
