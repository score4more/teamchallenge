import React, {useEffect} from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import DropZone from "../Components/DropZone";
import PDFTable from "../Components/PDFTable";
import {AppDispatch, RootState} from "../store/configureStore";
import {privateRequest} from "../hooks/requestHandler";
import {notification} from "antd";
import {setAllPDFs} from "../store/pdfsSlice";
import {hideOverlay, showOverlay} from "../Components/helpers";
import {PDFMetadata} from "../store/initialState";

const Dashboard: React.FC = () => {
  const { logout, token } = useAuth();
  const allPDFs = useSelector<RootState, PDFMetadata[]>(
      (state: RootState) => state.pdfReducer.allPDFs
  );
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const fetchAllPDFs = async () => {
      try {
        const response = await privateRequest("http://localhost:8000/pdfs", token, {
          method: "GET",
        } as RequestInit);
        const data = await response.json();
        if (response.ok) {
          dispatch(setAllPDFs(data));
        } else {
          notification.error({ message: "Error", description: data.detail || "Unknown error" });
        }
        hideOverlay();
      } catch (error) {
        notification.error({ message: "Error", description: "Error Fetching Data." });
        hideOverlay();
      }
    }

    if (!allPDFs.length) {
      showOverlay();
      fetchAllPDFs();
    }

  }, [])

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Code Challenge Dashboard
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to the Dashboard
        </Typography>
        <DropZone/>
        <PDFTable/>
      </Container>
    </Box>
  );
};

export default Dashboard;