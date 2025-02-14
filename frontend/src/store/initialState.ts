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
  loading: boolean;
  uploading: boolean;
  error: string | null;
  uploadError: string | null;
  fetched: boolean;
  loadingChunks: boolean;
  errorChunks: string | null;
}

// Initial state
export const initialState: PDFState = {
  allPDFs: [],
  pdfChunks: {},
  loading: false,
  error: null,
  uploading: true,
  uploadError: null,
  fetched: false,
  loadingChunks: false,
  errorChunks: null,
};
