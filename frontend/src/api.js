import axios from "axios";
export const extractObligations = async (company, file) => {
  const form = new FormData();
  form.append("company", company);
  form.append("pdf", file);
  const res = await axios.post("http://127.0.0.1:8000/api/extract", form, {
    headers: {"Content-Type": "multipart/form-data"},
  });
  return res.data.obligations;
};
