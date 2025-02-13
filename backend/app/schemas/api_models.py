from pydantic import BaseModel, ConfigDict
from datetime import datetime


class PDFMetaDataSchema(BaseModel):
    id: int
    title: str
    uploaded_by: str
    upload_date: datetime
    total_pages: int
    size: int

    model_config = ConfigDict(from_attributes=True)


class PDFChunkSchema(BaseModel):
    id: int
    pdf_id: int
    page_number: int
    content: str

    model_config = ConfigDict(from_attributes=True)
