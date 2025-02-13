import { useParams } from "react-router-dom";
import {AppBar, Box, Button, Container, Toolbar, Typography} from "@mui/material";
import React, {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {AppDispatch, RootState} from "../store/configureStore";
import {privateRequest} from "../hooks/requestHandler";
import {setAllPDFs, setPDFChunks} from "../store/pdfsSlice";
import {notification} from "antd";
import {hideOverlay, showOverlay} from "../Components/helpers";
import {useAuth} from "../context/AuthContext";
import {PDFMetadata} from "../store/initialState";
import {useNavigate} from "react-router-dom";
import PDFChunksTable from "../Components/PDFChunksTable";

const PDFDetail = () => {
  const {id} = useParams<{ id: string }>();
  const {token, logout} = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const allPDFs = useSelector<RootState, PDFMetadata[]>(
      (state: RootState) => state.pdfReducer.allPDFs
  );
  const pdfMetadata: PDFMetadata | undefined = allPDFs.find((pdf) => pdf.id === Number(id));
  const allPDFChunks = useSelector((state: RootState) => state.pdfReducer.pdfChunks[id || ""]);

  useEffect(() => {
    if (!allPDFChunks) {
      (async () => {
        await fetchPDFChunks();
      })();
    }
  }, [id, allPDFChunks]);

  const fetchPDFChunks = async () => {
    try {
      showOverlay();
      const response = await privateRequest(`http://localhost:8000/pdf_chunks/${id}`, token, {
        method: "GET",
      } as RequestInit);
      const data = await response.json();
      if (response.ok) {
        dispatch(setPDFChunks({ pdfId: Number(id), chunks: data.chunks }));
        if (!allPDFs.length) {
          dispatch(setAllPDFs(data.meta_data));
        }
      } else {
        notification.error({message: "Error", description: data.detail || "Unknown error"});
      }
    } catch (error) {
      notification.error({message: "Error", description: "Error Fetching Data."});
    } finally {
      hideOverlay();
    }
  }


  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {pdfMetadata ? pdfMetadata.title : "..."}
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <PDFChunksTable pdfChunks={allPDFChunks}/>
      </Container>
      <Button className="back-button" onClick={() => navigate(-1)}>
        Back
      </Button>
    </Box>
  );
};

export default PDFDetail;