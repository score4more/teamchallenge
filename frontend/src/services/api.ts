import {privateRequest} from "../hooks/requestHandler";
import {PDFMetadata} from "../store/initialState";

export const fetchAllPDFsService = async (token: string): Promise<PDFMetadata[]> => {
  const response = await privateRequest("http://localhost:8000/pdfs", token, {
    method: "GET",
  } as RequestInit);

  if (!response.ok) {
    throw new Error("Error fetching PDFs");
  }

  return response.json();
};

export const uploadPDFRequest = async (file: File, token: string) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await privateRequest("http://localhost:8000/upload", token, {
    method: "POST",
    body: formData,
  } as RequestInit);

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Upload failed");

  return data.pdf_meta;
};

// src/api.ts
export const fetchPDFChunksRequest = async (id: string, token: string) => {
  const response = await privateRequest(`http://localhost:8000/pdf_chunks/${id}`, token, {
    method: "GET",
  } as RequestInit);

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Error fetching PDF chunks");

  return data;
};
