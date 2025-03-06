const BASE_URL = "http://localhost:8000";

export const fetchPdfs = async () => {
  const res = await fetch(`${BASE_URL}/pdfs`);
  return res.json();
};

export const fetchPdfDetails = async (id: string) => {
  const res = await fetch(`${BASE_URL}/pdf/${id}`);
  return res.json();
};

export const uploadPdf = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  return res.json();
};
