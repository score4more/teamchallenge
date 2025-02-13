import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import {initialState, PDFMetadata, PDFChunk, PDFState} from "./initialState";
import {fetchAllPDFsService, uploadPDFRequest, fetchPDFChunksRequest} from "../services/api";
import {notification} from "antd";

export const fetchAllPDFs = createAsyncThunk<PDFMetadata[], string>(
  "pdfs/fetchAll",
  async (token: string, { rejectWithValue }) => {
    try {
      return await fetchAllPDFsService(token);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
});

export const uploadPDF = createAsyncThunk(
  "pdfs/upload",
  async ({ file, token }: { file: File; token: string }, { rejectWithValue }) => {
    try {
      return await uploadPDFRequest(file, token);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPDFChunks = createAsyncThunk(
  "pdfs/fetchChunks",
  async ({ id, token }: { id: string; token: string }, { rejectWithValue }) => {
    try {
      return await fetchPDFChunksRequest(id, token);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const pdfsSlice = createSlice({
  name: "pdfs",
  initialState,
  reducers: {
    setAllPDFs: (state, action: PayloadAction<PDFMetadata[]>) => {
      state.allPDFs = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllPDFs.pending, (state: PDFState) => {
        state.loading = true;
        state.error = null;
        state.fetched = false;
      })
      .addCase(fetchAllPDFs.fulfilled, (state: PDFState, action) => {
        state.loading = false;
        state.allPDFs = action.payload;
        state.fetched = true;
      })
      .addCase(fetchAllPDFs.rejected, (state: PDFState, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.fetched = false;
      })
      .addCase(uploadPDF.pending, (state: PDFState) => {
        state.uploading = true;
        state.uploadError = null;
      })
      .addCase(uploadPDF.fulfilled, (state: PDFState, action) => {
        state.uploading = false;
        state.allPDFs.push(action.payload);
        state.fetched = true;
        notification.success({ message: "Success", description: "File uploaded successfully!" });
      })
      .addCase(uploadPDF.rejected, (state: PDFState, action) => {
        state.uploading = false;
        state.uploadError = action.payload as string;
        notification.error({ message: "Upload Failed", description: action.payload || "Unknown error" });
      })
      .addCase(fetchPDFChunks.pending, (state: PDFState) => {
        state.loadingChunks = true;
        state.errorChunks = null;
      })
      .addCase(fetchPDFChunks.fulfilled, (state: PDFState, action) => {
        state.loadingChunks = false;
        state.errorChunks = null;
        state.pdfChunks[action.payload.id] = action.payload.chunks;
        state.allPDFs = action.payload.meta_data;
        state.fetched = true;
      })
      .addCase(fetchPDFChunks.rejected, (state: PDFState, action) => {
        state.loadingChunks = false;
        state.errorChunks = action.payload as string;
      });


  },
});

export const {
  setAllPDFs,
} = pdfsSlice.actions;

// Export reducer
export default pdfsSlice.reducer;