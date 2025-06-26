import axios from "axios";

const client = axios.create({ baseURL: "http://127.0.0.1:8000/api" });

export const uploadPdf = async (file) => {
  const form = new FormData();
  form.append("pdf", file);
  const { data } = await client.post("/upload-pdf", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.key;
};

export const getPdfUrl = async (key) => {
  const { data } = await client.get("/pdf-url", {
    params: { key },
  });
  return data.url;
};

export const extractFromS3 = async (company, key) => {
  const form = new FormData();
  form.append("company", company);
  form.append("key", key);
  const res = await client.post("/extract-s3", form);
  return res.data;  // { obligations: [...] }
};

// existing imports & client...
export const listPdfs = async () => {
  const { data } = await client.get("/list-pdfs");
  return data.keys;
};

export const deletePdf = async (key) => {
  const { data } = await client.delete("/pdf", { params: { key } });
  return data.success;
};

export const fetchOutput = (pdfKey) =>
  client.get("/output", { params: { pdfKey } }).then(res => res.data.obligations);

export const discoverRegs = async (companyName, companyInfo, country) => {
  const form = new FormData();
  form.append("companyName", companyName);
  form.append("companyInfo", companyInfo);
  form.append("location", country);
  // returns { key, regulations }
  const { data } = await client.post("/discover", form);
  return data;
};