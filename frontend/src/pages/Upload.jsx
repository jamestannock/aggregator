import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FileDropZone from "../components/FileDropZone";
import { extractObligations } from "../api";

export default function Upload({ setObligations, setCompany }) {
  const [companyInput, setCompanyInput] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault();
    if (!file) return alert("Please select a PDF.");
    setLoading(true);
    try {
      const obs = await extractObligations(companyInput, file);
      setCompany(companyInput);
      setObligations(obs);
      nav("/results");
    } catch {
      alert("Failed, check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">Upload Legislation</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Company Name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={companyInput}
            onChange={e => setCompanyInput(e.target.value)}
            required
          />
        </div>
        <FileDropZone onFileSelect={setFile} />
        {file && <p className="text-sm text-gray-500">Selected: {file.name}</p>}
        <button
          disabled={loading}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded shadow hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Processing…" : "Extract Obligations"}
        </button>
      </form>
    </>
  );
}
