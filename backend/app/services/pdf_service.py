import os
from fastapi import UploadFile, HTTPException
from ..core.config import settings
import shutil
from datetime import datetime

class PDFService:
    @staticmethod
    def allowed_file(filename: str) -> bool:
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in settings.ALLOWED_EXTENSIONS

    @staticmethod
    async def save_pdf(file: UploadFile) -> str:
        if not PDFService.allowed_file(file.filename):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")

        # Create a unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_FOLDER, filename)

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            return filename
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
        finally:
            file.file.close()

pdf_service = PDFService() 