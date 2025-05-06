from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base

class PDFDocument(Base):
    __tablename__ = "pdf_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    filename = Column(String)
    total_pages = Column(Integer)
    uploaded_by = Column(String)
    
    # Relationship with chunks
    chunks = relationship("PDFChunk", back_populates="document")

class PDFChunk(Base):
    __tablename__ = "pdf_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("pdf_documents.id"))
    page_number = Column(Integer)
    content = Column(Text)
    
    # Relationship with document
    document = relationship("PDFDocument", back_populates="chunks") 