import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  InputAdornment,
  Pagination,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { createApiClient, PaginatedResponse, DocumentSearchParams } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Document {
  id: number;
  title: string;
  filename: string;
  total_pages: number;
  uploaded_by: string;
}

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

// Memoized SearchBar component to prevent re-renders when parent re-renders
const SearchBar = memo(({ searchTerm, onSearchChange, inputRef }: SearchBarProps) => {
  return (
    <TextField
      fullWidth
      variant="outlined"
      placeholder="Search documents..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      inputRef={inputRef}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
      sx={{ mb: 2 }}
    />
  );
});

// Memoized document table component
const DocumentTable = memo(({ documents, onSelectDocument }: { 
  documents: Document[],
  onSelectDocument: (id: number) => void
}) => {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="document table">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell>Title</TableCell>
            <TableCell>Pages</TableCell>
            <TableCell>Uploaded By</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {documents.map((doc) => (
            <TableRow 
              key={doc.id}
              hover
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {doc.title}
              </TableCell>
              <TableCell>{doc.total_pages}</TableCell>
              <TableCell>{doc.uploaded_by}</TableCell>
              <TableCell align="right">
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={() => onSelectDocument(doc.id)}
                >
                  View Chunks
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

interface DocumentListProps {
  onSelectDocument: (documentId: number) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ onSelectDocument }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  
  // Pagination and search state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Ref for search input to manage focus
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const fetchDocuments = useCallback(async (params: DocumentSearchParams) => {
    try {
      setLoading(true);
      setIsSearching(true);
      const apiClient = createApiClient(token);
      const response = await apiClient.getDocuments(params);
      setDocuments(response.items);
      setTotalPages(response.pages);
      setError(null);
    } catch (err) {
      setError('Failed to load documents. Please try again later.');
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
      // Keep track that we just finished searching
      setTimeout(() => setIsSearching(false), 0);
    }
  }, [token]);

  useEffect(() => {
    fetchDocuments({ page, size: pageSize, search: searchTerm || undefined });
  }, [fetchDocuments, page, pageSize]);
  
  // Effect to restore focus after searching completes
  useEffect(() => {
    if (!loading && isSearching === false && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [loading, isSearching]);
  
  // Handle search with debounce - memoized to prevent recreation on re-renders
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    
    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set a new timeout to delay the search
    const timeout = setTimeout(() => {
      setPage(1); // Reset to first page on new search
      fetchDocuments({ page: 1, size: pageSize, search: value || undefined });
    }, 500); // 500ms debounce
    
    setSearchTimeout(timeout);
  }, [fetchDocuments, pageSize, searchTimeout]);
  
  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  }, []);

  if (loading && documents.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && documents.length === 0) {
    return (
      <Paper sx={{ p: 2, bgcolor: '#fff4f4' }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <SearchBar 
          searchTerm={searchTerm} 
          onSearchChange={handleSearchChange}
          inputRef={searchInputRef}
        />
      </Box>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {documents.length === 0 ? (
        <Paper sx={{ p: 2 }}>
          <Typography>
            {searchTerm ? 'No documents match your search.' : 'No documents uploaded yet.'}
          </Typography>
        </Paper>
      ) : (
        <>
          <DocumentTable 
            documents={documents} 
            onSelectDocument={onSelectDocument} 
          />
          
          {/* Pagination controls */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default DocumentList; 