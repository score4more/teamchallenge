import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {useSelector} from "react-redux";
import {RootState} from "../store/configureStore";
import {PDFMetadata} from "../store/initialState";
import { Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, TableSortLabel, TablePagination } from "@mui/material";


const PDFTable: React.FC = () => {
  const allPDFs = useSelector<RootState, PDFMetadata[]>((state: RootState) => state.pdfReducer.allPDFs);
  const [orderBy, setOrderBy] = useState<keyof PDFMetadata>("title");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const navigate = useNavigate();

  const handleRequestSort = (property: keyof PDFMetadata) => {
    const isAscending = orderBy === property && order === "asc";
    setOrder(isAscending ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedPDFs = [...allPDFs].sort((a, b) => {
    if (a[orderBy] < b[orderBy]) return order === "asc" ? -1 : 1;
    if (a[orderBy] > b[orderBy]) return order === "asc" ? 1 : -1;
    return 0;
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Paper style={{marginTop: '20px'}}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {["title", "uploaded_by", "upload_date", "total_pages", "size"].map((column) => (
                <TableCell key={column}>
                  <TableSortLabel
                    active={orderBy === column}
                    direction={orderBy === column ? order : "asc"}
                    onClick={() => handleRequestSort(column as keyof PDFMetadata)}
                  >
                    {column.replace("_", " ").toUpperCase()}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedPDFs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pdf) => (
              <TableRow key={pdf.id}
                onClick={() => navigate(`/pdfs/${pdf.id}`)}
                style={{ cursor: "pointer" }}
                hover
              >
                <TableCell>{pdf.title}</TableCell>
                <TableCell>{pdf.uploaded_by}</TableCell>
                <TableCell>{new Date(pdf.upload_date).toLocaleDateString()}</TableCell>
                <TableCell>{pdf.total_pages}</TableCell>
                <TableCell>{(pdf.size / 1024).toFixed(2)} KB</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={allPDFs.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  )
}

export default PDFTable;
