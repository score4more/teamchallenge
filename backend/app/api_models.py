from pydantic import BaseModel
from datetime import datetime


class PDFMetaDataSchema(BaseModel):
    id: int
    title: str
    uploaded_by: str
    upload_date: datetime
    total_pages: int
    size: int

    class Config:
        from_attributes = True


class PDFChunkSchema(BaseModel):
    id: int
    pdf_id: int
    page_number: int
    content: str

    class Config:
        from_attributes = True