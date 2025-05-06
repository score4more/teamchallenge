import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Pagination
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import { createApiClient, ChunkSearchParams } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Chunk {
  id: number;
  document_id: number;
  page_number: number;
  content: string;
}

interface DocumentViewerProps {
  documentId: number | null;
  onBack: () => void;
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
      placeholder="Search content..."
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

// Memoized table view component
const ChunkTableView = memo(({ chunks, onChunkClick }: { 
  chunks: Chunk[], 
  onChunkClick: () => void 
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell>Page</TableCell>
            <TableCell>Content Preview</TableCell>
            <TableCell align="right">Word Count</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {chunks.map((chunk) => {
            const contentPreview = chunk.content.substring(0, 100) + (chunk.content.length > 100 ? '...' : '');
            const wordCount = chunk.content.split(/\s+/).filter(Boolean).length;
            
            return (
              <TableRow 
                key={chunk.id}
                hover
                sx={{ 
                  cursor: 'pointer',
                  '&:last-child td, &:last-child th': { border: 0 }
                }}
                onClick={onChunkClick}
              >
                <TableCell>{chunk.page_number}</TableCell>
                <TableCell>{contentPreview}</TableCell>
                <TableCell align="right">{wordCount}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

// Memoized accordion view component
const ChunkAccordionView = memo(({ chunks }: { chunks: Chunk[] }) => {
  return (
    <Box>
      {chunks.map((chunk) => (
        <Accordion key={chunk.id} sx={{ mb: 1 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`panel-${chunk.id}-content`}
            id={`panel-${chunk.id}-header`}
          >
            <Typography variant="subtitle1">
              Page {chunk.page_number}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Divider sx={{ mb: 2 }} />
            <Typography 
              variant="body2" 
              component="pre" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                overflowY: 'auto',
                maxHeight: '400px'
              }}
            >
              {chunk.content}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
});

const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentId }) => {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'accordion'>('table');
  const { token } = useAuth();
  
  // Pagination and search state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Ref for search input to manage focus
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const fetchChunks = useCallback(async (params: ChunkSearchParams) => {
    if (!documentId) return;
    
    try {
      setLoading(true);
      setIsSearching(true);
      const apiClient = createApiClient(token);
      const response = await apiClient.getDocumentChunks(documentId, params);
      setChunks(response.items);
      setTotalPages(response.pages);
      setTotalItems(response.total);
      setError(null);
    } catch (err) {
      setError('Failed to load document chunks. Please try again later.');
      console.error('Error fetching chunks:', err);
    } finally {
      setLoading(false);
      // Keep track that we just finished searching
      setTimeout(() => setIsSearching(false), 0);
    }
  }, [documentId, token]);

  useEffect(() => {
    if (!documentId) return;
    fetchChunks({ page, size: pageSize, search: searchTerm || undefined });
  }, [fetchChunks, page, pageSize]); // Don't include searchTerm in dependency array
  
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
      fetchChunks({ page: 1, size: pageSize, search: value || undefined });
    }, 500); // 500ms debounce
    
    setSearchTimeout(timeout);
  }, [fetchChunks, pageSize, searchTimeout]);
  
  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  }, []);
  
  const handleChangeViewMode = useCallback((event: React.SyntheticEvent, newValue: 'table' | 'accordion') => {
    setViewMode(newValue);
  }, []);
  
  const switchToAccordionView = useCallback(() => {
    setViewMode('accordion');
  }, []);

  if (!documentId) {
    return null;
  }

  if (loading && chunks.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && chunks.length === 0) {
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
      
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={viewMode}
          onChange={handleChangeViewMode}
          aria-label="chunk view mode"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab value="table" label="Table View" />
          <Tab value="accordion" label="Expanded View" />
        </Tabs>
      </Box>

      {chunks.length === 0 ? (
        <Paper sx={{ p: 2 }}>
          <Typography>
            {searchTerm ? 'No chunks match your search.' : 'No chunks found for this document.'}
          </Typography>
        </Paper>
      ) : viewMode === 'table' ? (
        <>
          <ChunkTableView 
            chunks={chunks} 
            onChunkClick={switchToAccordionView} 
          />
          
          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Box>
        </>
      ) : (
        <>
          <ChunkAccordionView chunks={chunks} />
          
          {/* Pagination */}
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
      
      {/* Show total results */}
      {totalItems > 0 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {chunks.length} of {totalItems} total results
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DocumentViewer; 