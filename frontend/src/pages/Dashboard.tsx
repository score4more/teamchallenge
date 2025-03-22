import React, { useEffect, useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  CircularProgress,
  Input,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { logout } = useAuth();
  const [pdfs, setPdfs] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchPdfs();
  }, []);

  // Fetch List of PDFs
  const fetchPdfs = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/list_pdfs/");
      const data = await response.json();
      console.log(data,"data")
      setPdfs(data);
    } catch (error) {
      console.error("Error fetching PDFs:", error);
    }
    setLoading(false);
  };

  // Fetch Sections of a PDF
  const fetchSections = async (pdfId: number) => {
    setSelectedPdf(pdfId);
    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/pdf/${pdfId}/sections/?page=1&size=5&search=${searchText}`
      );
      const data = await response.json();
      setSections(data);
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
    setLoading(false);
  };

  // Upload PDF
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a PDF file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/upload_pdf/", {
        method: "POST",
        body: formData,
        headers:{
          'Access-Control-Allow-Origin':'*'
        }
      });
      
      if (response.ok) {
        alert("PDF uploaded successfully!");
        fetchPdfs();

      } else {
        alert("Error uploading PDF.");
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
    setLoading(false);
  };

  // Generate PDF
  const generatePDF = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/generate_pdf/", {
        method: "POST",
      });

      if (response.ok) {
        alert("PDF generated successfully!");
        fetchPdfs();
      } else {
        alert("Error generating PDF.");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
    setLoading(false);
  };

  // Download PDF
  const downloadPDF = async (pdfId: number) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/download_pdf/${pdfId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pdf_${pdfId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PDF Dashboard
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        {/* Generate PDF Button */}
        <Button variant="contained" color="primary" onClick={generatePDF} sx={{ mb: 2 }}>
          Generate PDF
        </Button>

        {/* Upload PDF Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6">Upload PDF</Typography>
          <Input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            sx={{ mr: 2 }}
          />
          <Button variant="contained" color="secondary" onClick={handleUpload}>
            Upload
          </Button>
        </Box>

        {/* List PDFs */}
        <Typography variant="h5" gutterBottom>
          Uploaded PDFs
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : (
          <List>
            {pdfs.map((pdf) => (
              <ListItem key={pdf.id} button onClick={() => fetchSections(pdf.id)}>
                <ListItemText primary={`📄 ${pdf.filename} (Pages: ${pdf.total_pages})`} />
                <Button variant="outlined" onClick={() => downloadPDF(pdf.id)}>
                  Download
                </Button>
              </ListItem>
            ))}
          </List>
        )}

        {/* PDF Sections */}
        {selectedPdf && (
          <Paper sx={{ p: 2, mt: 4 }}>
            <Typography variant="h6">PDF Sections</Typography>
            <TextField
              fullWidth
              label="Search text"
              variant="outlined"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && fetchSections(selectedPdf)}
              sx={{ mt: 2, mb: 2 }}
            />
            <List>
              {sections.map((section) => (
                <ListItem key={section.id}>
                  <ListItemText primary={`Page ${section.page_number}: ${section.text}`} />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;
