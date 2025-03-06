import React, { useState } from "react";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";

interface PdfSearchProps {
  sections: { text: string }[];
}

const PdfSearch: React.FC<PdfSearchProps> = ({ sections }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ text: string }[]>([]);

  const handleSearch = () => {
    const filtered = sections.filter((section) => section.text.toLowerCase().includes(query.toLowerCase()));
    setResults(filtered);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6">Search PDF</Typography>
      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
        <TextField
          fullWidth
          label="Search text"
          variant="outlined"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </Box>

      {results.length > 0 && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6">Search Results</Typography>
          {results.map((res, index) => (
            <Typography key={index} variant="body1" sx={{ my: 1 }}>
              {res.text}
            </Typography>
          ))}
        </Paper>
      )}
    </Paper>
  );
};

export default PdfSearch;
