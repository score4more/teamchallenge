from datetime import datetime
import io
import PyPDF2
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Generic, TypeVar, Any
from ....services.pdf_service import pdf_service
from ....core.auth import get_current_user
from ....database import get_db
from ....models.pdf import PDFDocument, PDFChunk
from pydantic import BaseModel
from typing import TypeVar, Generic

router = APIRouter(
    tags=["pdf"],
    responses={
        404: {"description": "Not found"},
        401: {"description": "Not authenticated"},
        400: {"description": "Bad request"}
    }
)

T = TypeVar('T')

# Define response models
class ChunkResponse(BaseModel):
    id: int
    document_id: int
    page_number: int
    content: str
    
    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: int
    title: str
    filename: str
    total_pages: int
    uploaded_by: str
    
    class Config:
        from_attributes = True

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

@router.post(
    "/upload",
    summary="Upload PDF Document",
    description="Upload a PDF file to be processed and stored in the database",
    responses={
        200: {
            "description": "File uploaded successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "File uploaded and processed successfully",
                        "filename": "document.pdf",
                        "uploaded_by": "user@example.com",
                        "total_pages": 5
                    }
                }
            }
        }
    }
)
async def upload_pdf(
    file: UploadFile = File(..., description="PDF file to upload"),
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a PDF file and store its contents in the database.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Read PDF
    contents = await file.read()
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))

    # Save the file first
    filename = await pdf_service.save_pdf(file)
    
    # Create PDF document record
    document = PDFDocument(
        title=file.filename,
        filename=filename,
        total_pages=len(pdf_reader.pages),
        uploaded_by=current_user
    )
    db.add(document)
    db.flush()  # This will get us the document.id
    
    # Create chunks
    for page_num, page in enumerate(pdf_reader.pages, start=1):
        chunk = PDFChunk(
            document_id=document.id,
            page_number=page_num,
            content=page.extract_text()
        )
        db.add(chunk)
    
    # Commit all changes
    db.commit()
    
    return {
        "message": "File uploaded and processed successfully",
        "filename": filename,
        "uploaded_by": current_user,
        "total_pages": len(pdf_reader.pages)
    }

@router.get(
    "/documents", 
    response_model=PaginatedResponse[DocumentResponse],
    summary="Get All Documents",
    description="Retrieve all documents uploaded by the current user with pagination and search capabilities"
)
async def get_documents(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term for document title or filename"),
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all documents uploaded by the current user with pagination and search
    """
    # Base query
    query = db.query(PDFDocument).filter(PDFDocument.uploaded_by == current_user)
    
    # Apply search filter if provided
    if search:
        query = query.filter(
            (PDFDocument.title.ilike(f"%{search}%")) | 
            (PDFDocument.filename.ilike(f"%{search}%"))
        )
    
    # Get total count for pagination
    total = query.count()
    
    # Get paginated documents
    documents = query.offset((page - 1) * size).limit(size).all()
    
    # Calculate total pages
    total_pages = (total + size - 1) // size
    
    return {
        "items": documents,
        "total": total,
        "page": page,
        "size": size,
        "pages": total_pages
    }

@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get document details by ID
    """
    document = db.query(PDFDocument).filter(PDFDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document

@router.get("/search/chunks", response_model=PaginatedResponse[ChunkResponse])
async def search_chunks(
    query_text: str = Query(..., description="Text to search for in chunk content"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Items per page"),
    document_id: Optional[int] = Query(None, description="Filter by document ID"),
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search for chunks containing specific text
    """
    # Start with a query that joins chunks with their documents to check ownership
    query = db.query(PDFChunk).join(
        PDFDocument, PDFChunk.document_id == PDFDocument.id
    ).filter(
        PDFDocument.uploaded_by == current_user,
        PDFChunk.content.ilike(f"%{query_text}%")
    )
    
    # Filter by document if specified
    if document_id:
        query = query.filter(PDFChunk.document_id == document_id)
    
    # Get total count for pagination
    total = query.count()
    
    # Get paginated results
    chunks = query.offset((page - 1) * size).limit(size).all()
    
    # Calculate total pages
    total_pages = (total + size - 1) // size
    
    return {
        "items": chunks,
        "total": total,
        "page": page,
        "size": size,
        "pages": total_pages
    }

@router.get("/documents/{document_id}/chunks", response_model=PaginatedResponse[ChunkResponse])
async def get_document_chunks(
    document_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term for chunk content"),
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all chunks for a specific document with pagination and search
    """
    # Check if document exists and user has access to it
    document = db.query(PDFDocument).filter(PDFDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Base query for chunks from this document
    query = db.query(PDFChunk).filter(PDFChunk.document_id == document_id)
    
    # Apply search filter if provided
    if search:
        query = query.filter(PDFChunk.content.ilike(f"%{search}%"))
    
    # Get total count for pagination
    total = query.count()
    
    # Get paginated chunks for this document
    chunks = query.offset((page - 1) * size).limit(size).all()
    
    # Calculate total pages
    total_pages = (total + size - 1) // size
    
    return {
        "items": chunks,
        "total": total,
        "page": page,
        "size": size,
        "pages": total_pages
    }

@router.get("/chunks/{chunk_id}", response_model=ChunkResponse)
async def get_chunk(
    chunk_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific chunk by ID
    """
    chunk = db.query(PDFChunk).filter(PDFChunk.id == chunk_id).first()
    if not chunk:
        raise HTTPException(status_code=404, detail="Chunk not found")
    
    return chunk 