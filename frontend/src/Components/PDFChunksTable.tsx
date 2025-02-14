import React, { useState } from "react";
import {PDFChunk} from "../store/initialState";
import CloseIcon from "@mui/icons-material/Close";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Tooltip,
  TablePagination,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton
} from "@mui/material";

interface PDFChunksTableProps {
  pdfChunks: PDFChunk[];
}


const PDFChunksTable: React.FC<PDFChunksTableProps> = ({ pdfChunks }) => {
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedChunk, setSelectedChunk] = useState<PDFChunk | null>(null);


  const filteredChunks = pdfChunks?.filter((chunk) =>
    chunk.content.toLowerCase().includes(searchKeyword.toLowerCase())
  ).sort((a, b) => a.page_number - b.page_number);

  const handleOpenDialog = (chunk: PDFChunk) => {
    setSelectedChunk(chunk);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedChunk(null);
  };

  // To Highlight search text
  const highlightText = (text: string, keyword: string, isTooltip: boolean) => {
    if (!keyword.trim()) return text;
    const regex = new RegExp(`(${keyword})`, "gi");
    return text?.replace(regex,
        `<span style="${isTooltip ? "color: black;" : "background-color: yellow;"}">$1</span>`
    );
  };

  const handleGoPreviousPage = () => {
  if (!selectedChunk || selectedChunk.page_number <= 1) return;
  const previousPageChunk = pdfChunks.find(
    (chunk) => chunk.page_number === selectedChunk.page_number - 1
  );
  if (previousPageChunk) {
    setSelectedChunk(previousPageChunk);
  }
}

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleGoNextPage = () => {
    if (!selectedChunk || !pdfChunks?.length) return; // Prevent if no chunk or empty list

    const maxPageNumber = Math.max(...pdfChunks.map(chunk => chunk.page_number)); // Find max page number

    if (selectedChunk.page_number >= maxPageNumber) return; // Prevent if on last page

    const nextPageChunk = pdfChunks.find(
      chunk => chunk.page_number === selectedChunk.page_number + 1
    );

    if (nextPageChunk) {
      setSelectedChunk(nextPageChunk);
    }
  };

  return (
    <Stack>
      <TextField
        label="Search in content..."
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
      />
      <Paper style={{marginTop: "20px", padding: "10px"}}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell style={{ width: "20%" }}>Page Number</TableCell>
                <TableCell style={{ width: "80%" }}>Content</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredChunks && filteredChunks
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) // Paginate data
                .map((chunk) => (
                <TableRow
                  key={chunk.id}
                  onClick={() => handleOpenDialog(chunk)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell>{chunk.page_number}</TableCell>
                  <TableCell>
                    <Tooltip
                      title={
                        <span
                          style={{ whiteSpace: "pre-wrap" }}
                          dangerouslySetInnerHTML={{ __html: highlightText(chunk.content, searchKeyword, true) }}
                        />
                      }
                      arrow
                    >
                      <div
                        style={{
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 5, // Limits to 3 lines
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "pre-wrap",
                          cursor: "pointer"
                        }}
                        dangerouslySetInnerHTML={{
                          __html: highlightText(chunk.content, searchKeyword, false),
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={pdfChunks?.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton> Page {selectedChunk?.page_number}
        </DialogTitle>
        <DialogContent dividers>
          <div
            style={{ whiteSpace: "pre-wrap" }}
            dangerouslySetInnerHTML={{
              __html: highlightText(selectedChunk?.content, searchKeyword, false),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", margin: "10px" }}>
            <Button
              onClick={handleGoPreviousPage}
              color="primary"
              variant="contained"
              disabled={selectedChunk?.page_number === 1}
            >
              Previous Page
            </Button>
            <Button
              onClick={handleGoNextPage}
              color="primary"
              variant="contained"
              disabled={
                selectedChunk?.page_number === Math.max(...(pdfChunks?.map(c => c.page_number) || []))
              }
            >
              Next Page
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default PDFChunksTable;
