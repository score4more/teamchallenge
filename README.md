# Score4More

Score4More is a web application that helps users upload and analyze PDF documents. The project consists of both frontend and backend components.

## Project Structure

- `frontend/` - React-based web interface
- `backend/` - FastAPI-based API server

## Features

- JWT-based authentication
- PDF document upload and processing
- Interactive dashboard
- API documentation with Swagger UI
- Cross-platform compatibility

## Requirements

- Node.js (for frontend)
- Python 3.11.7 (for backend)
- [Poetry](https://python-poetry.org/) for Python dependency management

## Setup and Running

### Backend

1. Navigate to the backend directory:
   ```sh
   cd backend
   ```

2. Install dependencies:
   ```sh
   poetry install
   ```

3. Run the server:
   ```sh
   poetry run start
   ```

4. Access the API documentation:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

### Frontend

1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the development server:
   ```sh
   npm run dev
   ```

4. Access the application in your browser at http://localhost:5173/

## Environment Variables

- Backend configuration is managed in `backend/app/core/config.py`
