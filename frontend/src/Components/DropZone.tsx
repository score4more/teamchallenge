import {Box, Stack, Typography} from "@mui/material";
import React from "react";
import {useDropzone} from "react-dropzone";
import {notification} from "antd";
import {privateRequest} from "../hooks/requestHandler";
import {useAuth} from "../context/AuthContext";
import {showOverlay, hideOverlay} from "./helpers";
import {setAllPDFs} from "../store/pdfsSlice";
import {useDispatch, useSelector} from "react-redux";
import {AppDispatch, RootState} from "../store/configureStore";
import {PDFMetadata} from "../store/initialState";

const DropZone: React.FC = () => {
  const {token} = useAuth()
  const allPDFs = useSelector<RootState, PDFMetadata[]>((state: RootState) => state.pdfReducer.allPDFs);
  const dispatch = useDispatch<AppDispatch>();

  const onDrop = (acceptedFiles: File[], fileRejections: any[]) => {
    const allFiles = [...fileRejections, ...acceptedFiles]
    if (allFiles.length > 1) {
      notification.open({
        type: "error",
        message: "Error",
        description: "You can only upload one file at a time.",
        key: `${Date.now()}`,
      });
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (selectedFile?.type !== "application/pdf") {
      notification.open({
        type: "error",
        message: "Error",
        description: "Only PDF files are allowed",
        key: `${Date.now()}`
      });
      return;
    }
    handleSubmit(selectedFile);
  };

  const {getRootProps, getInputProps, isDragActive, fileRejections} = useDropzone({
    onDrop,
    accept: {"application/pdf": [".pdf"]},
    maxFiles: 1,
  });

  const handleSubmit = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    try {
      showOverlay();
      const response = await privateRequest("http://localhost:8000/upload", token, {
        method: "POST",
        body: formData,
      } as RequestInit);

      const data = await response.json();

      if (response.ok) {
        const updatedPDFs = [...allPDFs, data.pdf_meta];
        dispatch(setAllPDFs(updatedPDFs));
        notification.success({ message: "Success", description: "File uploaded successfully!" });
      } else {
        notification.error({ message: "Upload Failed", description: data.detail || "Unknown error" });
      }
      hideOverlay();
    } catch (error) {
      notification.error({ message: "Error", description: "An error occurred during file upload." });
      hideOverlay();
    }
  };

  return (
    <Stack>
      <Typography variant="body1">Upload a PDF file:</Typography>
      {/* @ts-ignore */}
      <Box
        component="div"
        {...getRootProps()}
        sx={{
          p: 2,
          mt: 2,
          textAlign: "center",
          border: "2px dashed #aaa",
          cursor: "pointer",
          transition: "background-color 0.2s, border-color 0.2s",
          backgroundColor: isDragActive ? "#e3f2fd" : "transparent",
          borderColor: isDragActive ? "#1976d2" : "#aaa",
          "&:hover": {backgroundColor: "#f9f9f9"},
        }}
      >
        <input {...getInputProps()} />
        <Typography variant="body2">
          Drag & drop a PDF file here or click to select one.
        </Typography>
      </Box>
    </Stack>
  )
}

export default DropZone;