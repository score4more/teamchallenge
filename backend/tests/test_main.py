import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app, get_db, Base, UPLOAD_DIR
from auth import get_password_hash, verify_password, create_access_token  # Assuming auth.py exists

TEST_DATABASE_URL = "sqlite:///./test_database.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

Base.metadata.create_all(bind=engine)
client = TestClient(app)

os.makedirs(UPLOAD_DIR, exist_ok=True)

# Test cases for main.py endpoints
def test_generate_pdf():
    response = client.post("/generate_pdf/", data={"title": "Test PDF", "total_pages": 5})
    assert response.status_code == 200
    data = response.json()
    assert "filename" in data
    assert "total_pages" in data
    assert data["total_pages"] == 5
    assert os.path.exists(os.path.join(UPLOAD_DIR, data["filename"]))

def test_upload_pdf():
    pdf_path = "sample.pdf"
    with open(pdf_path, "wb") as f:
        f.write(b"%PDF-1.4 Sample PDF File")
    with open(pdf_path, "rb") as pdf_file:
        response = client.post("/upload_pdf/", files={"file": ("sample.pdf", pdf_file, "application/pdf")})
    assert response.status_code == 200
    assert "filename" in response.json()
    os.remove(pdf_path)

def test_list_pdfs():
    response = client.get("/list_pdfs/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_pdf():
    response = client.get("/pdf/1")
    assert response.status_code in [200, 404]

def test_download_pdf():
    response = client.get("/download_pdf/sample.pdf")
    assert response.status_code in [200, 404]

def test_split_pdf():
    response = client.get("/split_pdf/sample.pdf/1/2")
    assert response.status_code in [200, 404]

def test_extract_text():
    response = client.get("/extract_text/sample.pdf")
    assert response.status_code in [200, 404]

# Test cases for auth.py
def test_hash_password():
    password = "securepassword"
    hashed = get_password_hash(password)
    assert hashed != password  # Hash should be different from the actual password
    assert verify_password(password, hashed)  # Verify function should return True

def test_create_access_token():
    data = {"sub": "testuser"}
    token = create_access_token(data)
    assert isinstance(token, str)

def test_login_user():
    response = client.post("/login", data={"username": "testuser", "password": "testpassword"})
    assert response.status_code in [200, 401]  # 200 if credentials are correct, 401 otherwise
