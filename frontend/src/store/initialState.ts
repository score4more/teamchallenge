export interface PDFMetadata {
  id: number;
  title: string;
  total_pages: number;
  upload_date: string;
  size: number;
  fileName: string;
  uploaded_by: string;
}

export interface PDFChunk {
  id: number,
  pdf_id: number,
  page_number: number,
  content: string | "";
}

export interface PDFState {
  allPDFs: PDFMetadata[];
  pdfChunks: Record<number, PDFChunk[]>; // Dictionary where key = PDF ID, value = array of chunks
}

// Initial state
export const initialState: PDFState = {
  allPDFs: [],
  pdfChunks: {},
};
