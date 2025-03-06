import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPdfDetails } from "../api/api";

const PdfDetail: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [pdf, setPdf] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return; // ✅ Prevent API call if id is undefined

    const loadPdf = async () => {
      try {
        const data = await fetchPdfDetails(id);
        setPdf(data);
        setSections(data.sections);
      } catch (error) {
        console.error("Error fetching PDF details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [id]);

  if (!id) return <p>Error: No PDF ID found</p>; // ✅ Handle missing ID gracefully
  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>{pdf?.title}</h2>
      <p>Uploaded on: {pdf?.uploaded_at}</p>
      <h3>Sections:</h3>
      <ul>
        {sections.map((section, index) => (
          <li key={index}>{section.text}</li>
        ))}
      </ul>
    </div>
  );
};

export default PdfDetail;
