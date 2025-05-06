import React, { useState, useRef, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Modal,
  Paper, 
  CircularProgress,
  Alert,
  Snackbar,
  IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import { createApiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PdfUploaderModalProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const PdfUploaderModal: React.FC<PdfUploaderModalProps> = ({ 
  open, 
  onClose, 
  onUploadSuccess 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();
  
  // Reset state when modal is opened
  React.useEffect(() => {
    if (open) {
      setFile(null);
      setError(null);
      setSuccessMessage(null);
    }
  }, [open]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Check if the file is a PDF
    if (selectedFile.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      const apiClient = createApiClient(token);
      const result = await apiClient.uploadPdf(file);
      
      setSuccessMessage(`File "${result.filename}" uploaded successfully!`);
      setFile(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Notify parent component about success
      onUploadSuccess();
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload file. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      setIsDragging(true);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  return (
    <>
      <Modal
        open={open}
        onClose={!uploading ? onClose : undefined}
        aria-labelledby="pdf-upload-modal-title"
        aria-describedby="pdf-upload-modal-description"
      >
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 500 },
            p: 4,
            outline: 'none',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography id="pdf-upload-modal-title" variant="h6" component="h2">
              Upload PDF Document
            </Typography>
            {!uploading && (
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            )}
          </Box>
          
          <Box
            sx={{
              mt: 2,
              mb: 3,
              py: 4,
              px: 2,
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'grey.400',
              borderRadius: 2,
              backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
            }}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              accept="application/pdf"
              style={{ display: 'none' }}
              id="pdf-file-upload-modal"
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
            />
            
            <CloudUploadIcon sx={{ fontSize: 48, color: isDragging ? 'primary.main' : 'text.secondary', mb: 2 }} />
            
            <Typography variant="body1" align="center" gutterBottom>
              {isDragging ? 'Drop your PDF here' : 'Drag & drop your PDF here, or click to browse'}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" align="center">
              Only PDF files are accepted
            </Typography>
            
            {file && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 2, 
                  fontWeight: 'bold',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                Selected: {file.name}
              </Typography>
            )}
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={!file || uploading}
              startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : undefined}
            >
              {uploading ? 'Uploading...' : 'Upload PDF'}
            </Button>
          </Box>
        </Paper>
      </Modal>
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        message={successMessage}
      />
    </>
  );
};

export default PdfUploaderModal; 