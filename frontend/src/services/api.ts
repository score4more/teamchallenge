import {privateRequest} from "../hooks/requestHandler";
import {PDFMetadata} from "../store/initialState";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ username: email, password: password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Login failed");
    }

    return data.access_token;
  } catch (error) {
    throw new Error("Login failed");
  }
};

export const fetchAllPDFsService = async (token: string): Promise<PDFMetadata[]> => {
  const response = await privateRequest(`${API_BASE_URL}/pdfs`, token, {
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

  const response = await privateRequest(`${API_BASE_URL}/upload`, token, {
    method: "POST",
    body: formData,
  } as RequestInit);

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Upload failed");

  return data.pdf_meta;
};

// src/api.ts
export const fetchPDFChunksRequest = async (id: string, token: string) => {
  const response = await privateRequest(`${API_BASE_URL}/pdf_chunks/${id}`, token, {
    method: "GET",
  } as RequestInit);

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Error fetching PDF chunks");

  return data;
};
