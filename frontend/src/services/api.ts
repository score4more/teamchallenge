import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

// Define interfaces for pagination and search params
export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface DocumentSearchParams extends PaginationParams {
  search?: string;
}

export interface ChunkSearchParams extends PaginationParams {
  search?: string;
}

// Define interface for paginated response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const createApiClient = (token: string | null) => {
  const client = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  return {
    // Auth endpoints
    validateToken: async () => {
      try {
        const response = await client.get('/auth/validate-token');
        return response.data;
      } catch (error) {
        // If the request fails, the token is invalid or expired
        return { valid: false, message: 'Token validation failed' };
      }
    },
    
    // Document endpoints
    uploadPdf: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await client.post('/pdf/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    
    getDocuments: async (params?: DocumentSearchParams) => {
      const response = await client.get('/pdf/documents', { params });
      return response.data;
    },
    
    getDocumentChunks: async (documentId: number, params?: ChunkSearchParams) => {
      const response = await client.get(`/pdf/documents/${documentId}/chunks`, { params });
      return response.data;
    },
    
    getChunk: async (chunkId: number) => {
      const response = await client.get(`/pdf/chunks/${chunkId}`);
      return response.data;
    },
    
    searchChunks: async (queryText: string, params?: PaginationParams & { document_id?: number }) => {
      const searchParams = { ...params, query_text: queryText };
      const response = await client.get(`/pdf/search/chunks`, { params: searchParams });
      return response.data;
    }
  };
}; 