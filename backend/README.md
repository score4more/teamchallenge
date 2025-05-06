# Score4More Backend

This is the backend API for the Score4More project, built with FastAPI.

## Features

- JWT-based authentication
- PDF upload endpoint (protected)
- Health check endpoint
- CORS enabled for frontend development
- Interactive API documentation with Swagger UI

## Requirements

- Python 3.10+
- [Poetry](https://python-poetry.org/) for dependency management

## Setup

1. **Install dependencies:**
   ```sh
   poetry install
   ```

2. **Run the server:**
   ```sh
   poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Environment variables:**
   - Configuration is managed in `app/core/config.py`. For production, set your own `SECRET_KEY` and adjust settings as needed.

## API Documentation

The API comes with interactive documentation powered by Swagger UI. 

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

These documentation pages allow you to:
- Explore all available endpoints
- Read detailed descriptions and parameter requirements
- Test API calls directly from the browser
- View response models and examples

## API Endpoints

### Auth

- **POST** `/api/v1/auth/login`  
  Get a JWT token.  
  **Body:**  
  - `username`: demo@example.com  
  - `password`: demo123

### PDF Upload

- **POST** `/api/v1/pdf/upload`  
  Upload a PDF file (requires Bearer token).  
  **Form Data:**  
  - `file`: PDF file

  **Headers:**  
  - `Authorization: Bearer <your_token>`

### Health Check

- **GET** `/health`  
  Returns `{ "status": "ok" }`

## Example Usage

1. **Get a token:**
   ```sh
   curl -X POST "http://localhost:8000/api/v1/auth/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=demo@example.com&password=demo123"
   ```

2. **Upload a PDF:**
   ```sh
   curl -X POST "http://localhost:8000/api/v1/pdf/upload" \
     -H "Authorization: Bearer <your_token>" \
     -F "file=@/path/to/your/file.pdf"
   ```

## Project Structure