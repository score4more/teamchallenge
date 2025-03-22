from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form , BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
from auth import create_access_token, get_password_hash, verify_password, get_current_user
import os
from PyPDF2 import PdfReader, PdfWriter
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import uuid
import fitz
import jwt
# Database setup
DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# PDF Model
class PDF(Base):
    __tablename__ = "pdfs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    filename = Column(String, unique=True, index=True)
    total_pages = Column(Integer)
    upload_date = Column(DateTime, default=datetime.utcnow)

# PDF Chunks Model
class PDFChunk(Base):
    __tablename__ = "pdf_chunks"
    id = Column(Integer, primary_key=True, index=True)
    pdf_id = Column(Integer, ForeignKey("pdfs.id"))
    page_number = Column(Integer)
    content = Column(String)

# Create tables
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI()

# Allow CORS for specific origins
origins = [
    "http://localhost:5173",  # Add your front-end URL here
]

# Add CORSMiddleware to your FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows specific origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)



# Dependency: Get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Directory setup
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username}, expires_delta=timedelta(minutes=30))
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    return {"message": f"Hello, {current_user.username}. You have access to this protected route!"}

### 1️⃣ GENERATE PDF WITH METADATA ###
@app.post("/generate_pdf/")
def generate_pdf(title: str = Form(...), total_pages: int = Form(...), db: Session = Depends(get_db)):
    filename = f"{title.replace(' ', '_')}.pdf"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Generate PDF with metadata
    c = canvas.Canvas(file_path, pagesize=letter)
    c.setFont("Helvetica", 12)
    c.drawString(100, 750, f"Title: {title}")
    c.drawString(100, 730, f"Upload Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
    c.drawString(100, 710, f"Total Pages: {total_pages}")

    for page in range(1, total_pages + 1):
        c.drawString(100, 680 - (page * 20), f"Page {page}")
        if page < total_pages:
            c.showPage()
    
    c.save()

    # Save metadata to DB
    new_pdf = PDF(title=title, filename=filename, total_pages=total_pages)
    db.add(new_pdf)
    db.commit()
    db.refresh(new_pdf)

    return {"message": "PDF created successfully", "filename": filename, "total_pages": total_pages}

### 📌 UPLOAD PDF AND PROCESS ###
@app.post("/upload_pdf/")
async def upload_pdf(backgroundtasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Now only authenticated users can upload PDFs
    filename = file.filename
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            buffer.write(chunk)

    pdf_reader = PdfReader(file_path)
    total_pages = len(pdf_reader.pages)

    new_pdf = PDF(title=filename, filename=unique_filename, total_pages=total_pages, upload_date=datetime.utcnow())
    db.add(new_pdf)
    db.commit()
    db.refresh(new_pdf)

    backgroundtasks.add_task(process_pdf, new_pdf.id, file_path, db)

    return {"message": "PDF uploaded and processed", "filename": unique_filename, "total_pages": total_pages}



def process_pdf(pdf_id , file_path ,db):

    # Extract and store text chunks
    for page_number, page in enumerate(pdf_reader.pages, start=1):
        text = page.extract_text() or ""
        pdf_chunk = PDFChunk(pdf_id=new_pdf.id, page_number=page_number, content=text)
        db.add(pdf_chunk)



### 📌 LIST ALL PDFs ###
@app.get("/list_pdfs/")
def list_pdfs(db: Session = Depends(get_db)):
    pdfs = db.query(PDF).all()
    return [{"id": pdf.id, "title": pdf.title, "filename": pdf.filename, "total_pages": pdf.total_pages, "upload_date": pdf.upload_date} for pdf in pdfs]

### 📌 GET PDF DETAILS ###
@app.get("/pdf/{pdf_id}")
def get_pdf(pdf_id: int, db: Session = Depends(get_db)):
    pdf = db.query(PDF).filter(PDF.id == pdf_id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    return {"id": pdf.id, "title": pdf.title, "filename": pdf.filename, "total_pages": pdf.total_pages, "upload_date": pdf.upload_date}

### 📌 FETCH PAGINATED CHUNKS ###
@app.get("/pdf_chunks/{pdf_id}")
def get_pdf_chunks(pdf_id: int, page: int = 1, per_page: int = 10, db: Session = Depends(get_db)):
    chunks = db.query(PDFChunk).filter(PDFChunk.pdf_id == pdf_id).offset((page - 1) * per_page).limit(per_page).all()
    return [{"page_number": chunk.page_number, "content": chunk.content} for chunk in chunks]

### 📌 SEARCH PDF CONTENT ###
@app.get("/search_pdf_chunks/")
def search_pdf_chunks(query: str, pdf_id: int, db: Session = Depends(get_db)):
    results = db.query(PDFChunk).filter(PDFChunk.pdf_id == pdf_id, PDFChunk.content.ilike(f"%{query}%")).all()
    return [{"page_number": chunk.page_number, "content": chunk.content} for chunk in results]