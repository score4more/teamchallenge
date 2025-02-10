import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { logout } = useAuth();

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
        <Typography variant="body1">
          This is where you'll implement the PDF upload and parsing feature.
        </Typography>
      </Container>
    </Box>
  );
};

export default Dashboard; 