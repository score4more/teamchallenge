import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  Divider,
  Card,
  CardContent,
  Fab,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../context/AuthContext';
import PdfUploaderModal from '../components/PdfUploaderModal';
import DocumentList from '../components/DocumentList';
import DocumentViewer from '../components/DocumentViewer';

const Dashboard = () => {
  const { logout, checkTokenValidity } = useAuth();
  const navigate = useNavigate();
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Check token validity when dashboard loads
  useEffect(() => {
    const validateToken = async () => {
      const isValid = await checkTokenValidity();
      if (!isValid) {
        navigate('/login');
      }
    };
    
    validateToken();
  }, [checkTokenValidity, navigate]);

  const handleSelectDocument = (documentId: number) => {
    setSelectedDocumentId(documentId);
  };

  const handleBack = () => {
    setSelectedDocumentId(null);
  };

  const handleUploadSuccess = () => {
    // Trigger a refresh of the document list
    setRefreshTrigger(prev => prev + 1);
  };

  const openUploadModal = async () => {
    // Validate token before opening upload modal
    const isValid = await checkTokenValidity();
    if (!isValid) {
      navigate('/login');
      return;
    }
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Document Management System
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container sx={{ mt: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedDocumentId ? (
          // Document Viewer View
          <Box sx={{ height: '100%' }}>
            <Paper sx={{ p: 3, flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button 
                  startIcon={<ArrowBackIcon />} 
                  onClick={handleBack}
                  variant="outlined"
                  sx={{ mr: 2 }}
                >
                  Back to Documents
                </Button>
                <Typography variant="h6">Document Chunks</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <DocumentViewer documentId={selectedDocumentId} onBack={handleBack} />
            </Paper>
          </Box>
        ) : (
          // Document List View
          <Box sx={{ position: 'relative', height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Document Management
            </Typography>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <DocumentList 
                  onSelectDocument={handleSelectDocument} 
                  key={refreshTrigger} // Force refresh when documents change
                />
              </CardContent>
            </Card>
            
            {/* Floating Action Button for Upload */}
            <Tooltip title="Upload PDF" placement="left">
              <Fab 
                color="primary" 
                aria-label="upload" 
                sx={{ 
                  position: 'fixed', 
                  bottom: 30, 
                  right: 30,
                  zIndex: 1000
                }}
                onClick={openUploadModal}
              >
                <AddIcon />
              </Fab>
            </Tooltip>
          </Box>
        )}
      </Container>
      
      {/* PDF Upload Modal */}
      <PdfUploaderModal
        open={isUploadModalOpen}
        onClose={closeUploadModal}
        onUploadSuccess={handleUploadSuccess}
      />
    </Box>
  );
};

export default Dashboard; 