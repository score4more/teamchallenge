import { configureStore } from "@reduxjs/toolkit";
import pdfReducer from "./pdfsSlice";

export const store = configureStore({
  reducer: {
    pdfReducer,
  },
});

// TypeScript types for store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;