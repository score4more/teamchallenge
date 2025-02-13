from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Optional
import jwt
import pdfplumber
from fastapi import Depends, HTTPException, status, APIRouter, UploadFile, File
from fastapi.encoders import jsonable_encoder
from app.database import get_db
from app.database_models import PDFMetaData, PDFChunk
from app.api_models import PDFMetaDataSchema, PDFChunkSchema
from sqlalchemy.orm import Session
from typing import List, Dict


app = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
SECRET_KEY = "your-secret-key-for-development"  # In production, use environment variable
ALGORITHM = "HS256"

# For demo purposes - in real app this would be in a database
DEMO_USER = {
    "username": "demo@example.com",
    "hashed_password": "demo123"  # In real app, this would be properly hashed
}


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Function to return access_token for gives username
    :param data: user name
    :param expires_delta: duration of token
    :return: Access Token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """

    :param token: Access Token
    :return: username
    """
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
    """
    login api providing username and password and return access token
    :param form_data: username and password
    :return: return access token for 30 mins expiry
    """
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


@app.post("/upload")
async def upload(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    API to upload files and get the metadata and store metadata in DB in table PDFMetaData and
    divide it into chunks and store them in table PDFChunk
    :param file: The pdf file
    :param current_user: The logged user who perform the operation
    :param db:
    :return: dict of the uploaded file metadata
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    size = file.size
    title = file.filename
    upload_date = datetime.utcnow()

    try:
        with pdfplumber.open(file.file) as pdf:
            total_pages = len(pdf.pages)
            new_pdf = PDFMetaData(
                title=title,
                total_pages=total_pages,
                size=size,
                upload_date=upload_date,
                uploaded_by=current_user
            )
            db.add(new_pdf)

            # Store each page as a chunk in DB
            all_chunks = []
            for page_number, page in enumerate(pdf.pages, start=1):
                text = page.extract_text() or "No text found"
                new_chunk = PDFChunk(pdf=new_pdf, page_number=page_number, content=text)
                all_chunks.append(new_chunk)

            db.add_all(all_chunks)
            db.commit()
            pdf_meta_data = PDFMetaDataSchema.model_validate(new_pdf)
            chunk_data = [PDFChunkSchema.model_validate(chunk) for chunk in all_chunks]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

    return jsonable_encoder({
        "message": "File uploaded successfully",
        "pdf_meta": pdf_meta_data,
    })


@app.get("/pdfs", response_model=List[PDFMetaDataSchema])
async def all_pdfs(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all pdfs uploaded by the logged in user
    :param current_user: the logged in user
    :param db: the db session
    :return: Return a list of PDF files metadata
    """
    pdfs = (db.query(PDFMetaData)
            .filter(PDFMetaData.uploaded_by == current_user)
            .all())
    return pdfs


@app.get("/pdf_chunks/{pdf_id}", response_model=Dict[str, List[PDFChunkSchema] | List[PDFMetaDataSchema]])
async def get_pdf_chunks(
    pdf_id: str,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all PDF chunks for a specific file id
    :param pdf_id: The pdf file id
    :param current_user: The logged user, to validate he is the owner of the file
    :param db: The database session
    :return: chunks list and all_metadata list
    """
    try:
        pdf_id = int(pdf_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid pdf_id.")

    pdfs = db.query(PDFMetaData).filter(PDFMetaData.uploaded_by == current_user).all()
    # Validate that user is owner of the PDF
    pdf = next((p for p in pdfs if p.id == pdf_id), None)

    if not pdf:
        raise HTTPException(status_code=403, detail="Access denied: You do not own this PDF.")

    chunks = db.query(PDFChunk).filter(PDFChunk.pdf_id == pdf_id).all()
    return {"chunks": chunks, "meta_data": pdfs}
