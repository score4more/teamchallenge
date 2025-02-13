import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initialState, PDFMetadata, PDFChunk } from "./initialState";

const pdfsSlice = createSlice({
  name: "pdfs",
  initialState,
  reducers: {
    setAllPDFs: (state, action: PayloadAction<PDFMetadata[]>) => {
      state.allPDFs = action.payload;
    },
    setPDFChunks: (state, action: PayloadAction<{ pdfId: number; chunks: PDFChunk[] }>) => {
      state.pdfChunks[action.payload.pdfId] = action.payload.chunks;
    },
  },
});

export const {
  setAllPDFs,
  setPDFChunks,
} = pdfsSlice.actions;

// Export reducer
export default pdfsSlice.reducer;