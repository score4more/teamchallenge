import io


def test_upload_pdf(client, auth_headers):
    """Test successful PDF upload."""
    with open("tests/sample.pdf", "rb") as f:
        pdf_content = f.read()

    files = {"file": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")}
    response = client.post("/upload", files=files, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["message"] == "File uploaded successfully"
    assert "pdf_meta" in response.json()


def test_upload_invalid_file(client, auth_headers):
    """Test uploading a non-PDF file."""
    files = {"file": ("test.txt", io.BytesIO(b"Some text content"), "text/plain")}

    response = client.post("/upload", files=files, headers=auth_headers)

    assert response.status_code == 400
    assert response.json()["detail"] == "Only PDF files are allowed"


def test_get_all_pdfs(client, auth_headers):
    """Test retrieving all PDFs for a user."""
    response = client.get("/pdfs", headers=auth_headers)

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_pdf_chunks_valid(client, auth_headers):
    """Test retrieving PDF chunks with a valid PDF ID."""
    # Upload PDF first
    with open("tests/sample.pdf", "rb") as f:
        files = {"file": ("test.pdf", f, "application/pdf")}
        upload_response = client.post("/upload", files=files, headers=auth_headers)

    assert upload_response.status_code == 200

    # Get pdf ID
    uploaded_pdf_id = upload_response.json()["pdf_meta"]["id"]

    # Request PDF chunks
    response = client.get(f"/pdf_chunks/{uploaded_pdf_id}", headers=auth_headers)
    assert response.status_code == 200
    assert "chunks" in response.json()
    assert "meta_data" in response.json()


def test_get_pdf_chunks_invalid(client, auth_headers):
    """Test retrieving PDF chunks with an invalid PDF ID."""
    response = client.get("/pdf_chunks/invalid_id", headers=auth_headers)

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid pdf_id."