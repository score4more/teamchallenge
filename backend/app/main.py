from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import os
from PyPDF2 import PdfReader, PdfWriter
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import uuidf

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

# Create tables
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI()

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

### 2️⃣ UPLOAD PDF ###
@app.post("/upload_pdf/")
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = file.filename
    unique_filename = f"{uuid.uuid4().hex}_{filename}"  # Generate a unique name
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Save the file
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Save metadata in the database
    new_pdf = PDF(filename=unique_filename, total_pages=0, upload_date=datetime.utcnow())
    db.add(new_pdf)
    db.commit()

    return {"message": "PDF uploaded successfully", "filename": unique_filename}

### 3️⃣ LIST ALL PDFs ###
@app.get("/list_pdfs/")
def list_pdfs(db: Session = Depends(get_db)):
    pdfs = db.query(PDF).all()
    return [{"id": pdf.id, "title": pdf.title, "filename": pdf.filename, "total_pages": pdf.total_pages, "upload_date": pdf.upload_date} for pdf in pdfs]

### 4️⃣ GET PDF DETAILS ###
@app.get("/pdf/{pdf_id}")
def get_pdf(pdf_id: int, db: Session = Depends(get_db)):
    pdf = db.query(PDF).filter(PDF.id == pdf_id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    return {"id": pdf.id, "title": pdf.title, "filename": pdf.filename, "total_pages": pdf.total_pages, "upload_date": pdf.upload_date}

### 5️⃣ DOWNLOAD PDF ###
@app.get("/download_pdf/{filename}")
def download_pdf(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="application/pdf", filename=filename)

### 6️⃣ SPLIT PDF INTO CHUNKS ###
@app.get("/split_pdf/{filename}/{start_page}/{end_page}")
def split_pdf(filename: str, start_page: int, end_page: int):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    pdf_reader = PdfReader(file_path)
    total_pages = len(pdf_reader.pages)

    if start_page < 1 or end_page > total_pages or start_page > end_page:
        raise HTTPException(status_code=400, detail="Invalid page range")

    pdf_writer = PdfWriter()
    for i in range(start_page - 1, end_page):
        pdf_writer.add_page(pdf_reader.pages[i])

    split_filename = f"split_{start_page}_{end_page}_{filename}"
    split_path = os.path.join(UPLOAD_DIR, split_filename)

    with open(split_path, "wb") as output_pdf:
        pdf_writer.write(output_pdf)

    return {"message": "PDF split successfully", "download_link": f"/download_pdf/{split_filename}"}

### 7️⃣ EXTRACT TEXT FROM PDF ###
@app.get("/extract_text/{filename}")
def extract_text(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    pdf_reader = PdfReader(file_path)
    extracted_text = ""

    for page in pdf_reader.pages:
        extracted_text += page.extract_text() + "\n"

    return {"filename": filename, "extracted_text": extracted_text}
