import React, {useEffect} from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, AppBar, Toolbar, Typography, Button, Container, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import DropZone from "../Components/DropZone";
import PDFTable from "../Components/PDFTable";
import {AppDispatch, RootState} from "../store/configureStore";
import {fetchAllPDFs} from "../store/pdfsSlice";


const Dashboard: React.FC = () => {
  const { logout, token } = useAuth();
  const { allPDFs, loading, error, fetched } = useSelector((state: RootState) => state.pdfReducer);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (token && !fetched) {
      dispatch(fetchAllPDFs(token));
    }
  }, [token, dispatch]);

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
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <PDFTable pdfs={allPDFs} />
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;