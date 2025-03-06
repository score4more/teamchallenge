import React, { useEffect, useState } from "react";
import { Box, List, ListItem, ListItemText, CircularProgress, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { fetchPdfs } from "../api/api";

const PdfList: React.FC = () => {
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPdfs = async () => {
      const data = await fetchPdfs();
      setPdfs(data);
      setLoading(false);
    };
    loadPdfs();
  }, []);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Uploaded PDFs
      </Typography>
      {loading ? <CircularProgress /> : (
        <List>
          {pdfs.map((pdf) => (
            <ListItem key={pdf.id} button onClick={() => navigate(`/pdf/${pdf.id}`)}>
              <ListItemText primary={pdf.filename} secondary={`Uploaded: ${pdf.uploaded_at}`} />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default PdfList;