// frontend/src/pages/Upload.jsx

import React, { useState, useEffect } from "react";
import {
  listPdfs,
  deletePdf,
  uploadPdf,
  getPdfUrl,
  extractFromS3,
  fetchOutput,      // <— new
} from "../api";
import FileDropZone from "../components/FileDropZone";
import ObligationList from "../components/ObligationList";

export default function UploadInline() {
  // S3-backed state
  const [allKeys, setAllKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState(
    localStorage.getItem("pdfKey") || ""
  );
  const [pdfUrl, setPdfUrl] = useState("");

  // Local inputs & results
  const [file, setFile] = useState(null);
  const [companyInput, setCompanyInput] = useState(
    localStorage.getItem("lastCompany") || ""
  );
  const [loading, setLoading] = useState(false);
  const [obligations, setObligations] = useState([]);

  // 1️⃣ Load list of PDFs once on mount
  useEffect(() => {
    (async () => {
      try {
        const keys = await listPdfs();
        setAllKeys(keys);
      } catch (err) {
        console.error("listPdfs error:", err);
      }
    })();
  }, []);

  // 2️⃣ Whenever selectedKey changes:
  //    • persist to localStorage
  //    • fetch presigned PDF URL
  //    • fetch any persisted obligations JSON
  useEffect(() => {
    if (!selectedKey) {
      setPdfUrl("");
      setObligations([]);
      localStorage.removeItem("pdfKey");
      return;
    }

    // persist selection
    localStorage.setItem("pdfKey", selectedKey);

    // fetch preview URL
    getPdfUrl(selectedKey)
      .then(({ url }) => setPdfUrl(url))
      .catch((err) => {
        console.error("getPdfUrl error:", err);
        setPdfUrl("");
      });

    // fetch persisted output.json
    fetchOutput(selectedKey)
      .then((data) => setObligations(data))
      .catch((err) => {
        console.error("fetchOutput error:", err);
        setObligations([]); // fallback
      });
  }, [selectedKey]);

  // 3️⃣ Upload a brand-new PDF
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a PDF first");
      return;
    }
    setLoading(true);
    try {
      const key = await uploadPdf(file);
      setSelectedKey(key);
      setFile(null);
      setObligations([]);              // clear old obligations
      setAllKeys(await listPdfs());    // refresh list
    } catch (err) {
      console.error("uploadPdf error:", err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // 4️⃣ Delete a PDF from S3
  const handleDelete = async (key) => {
    if (!window.confirm("Delete this PDF permanently?")) return;
    setLoading(true);
    try {
      await deletePdf(key);
      if (key === selectedKey) {
        setSelectedKey("");
      }
      setAllKeys(await listPdfs());
    } catch (err) {
      console.error("deletePdf error:", err);
      alert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // 5️⃣ Run the OpenAI extraction & persist output
  const handleRunModel = async () => {
    const company = companyInput.trim();
    if (!company) {
      alert("Please enter a company name");
      return;
    }
    if (!selectedKey) {
      alert("Please select or upload a PDF first");
      return;
    }
    setLoading(true);
    try {
      // this writes output/<base>.json in S3
      await extractFromS3(company, selectedKey);

      // re-fetch persisted JSON to display
      const data = await fetchOutput(selectedKey);
      setObligations(data);

      // persist company name
      localStorage.setItem("lastCompany", company);
    } catch (err) {
      console.error("extractFromS3 error:", err);
      alert("Model extraction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex space-x-6">
      {/* ── Left Column: Controls & PDF Preview ── */}
      <div className="w-1/2 space-y-4">
        {/* Company Name */}
        <div>
          <label className="block mb-1 font-medium">Company Name</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            placeholder="e.g. ACME Pty Ltd"
            value={companyInput}
            onChange={(e) => setCompanyInput(e.target.value)}
          />
        </div>

        {/* Existing PDFs */}
        <div className="space-y-2">
          <h3 className="font-semibold">Existing PDFs in S3</h3>
          {allKeys.length === 0 && (
            <p className="italic text-gray-500">No PDFs uploaded.</p>
          )}
          {allKeys.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between bg-gray-50 p-2 rounded"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedKey(key);
                }}
                className={`flex-1 text-left ${
                  key === selectedKey ? "font-bold text-blue-700" : ""
                }`}
              >
                {key.replace(/^raw\//, "")}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(key)}
                className="text-red-600 hover:underline ml-4"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {/* Upload New PDF */}
        <FileDropZone onFileSelect={setFile} />
        {file && <p className="text-sm text-gray-500">Selected: {file.name}</p>}
        <button
          type="button"
          onClick={handleUpload}
          disabled={loading || !file}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Uploading…" : "Upload New PDF"}
        </button>

        {/* Run Model */}
        {selectedKey && (
          <button
            type="button"
            onClick={handleRunModel}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 mt-4"
          >
            {loading ? "Running Model…" : "Run Model on Selected PDF"}
          </button>
        )}

        {/* PDF Preview */}
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            title="PDF Preview"
            className="w-full h-80 border mt-4"
          />
        )}
      </div>

      {/* ── Right Column: Persisted Model Output ── */}
      <div className="w-1/2 space-y-4">
        <h3 className="font-semibold">Extracted Obligations</h3>
        {loading && <p>Working…</p>}
        {!loading && obligations.length === 0 && (
          <p className="italic text-gray-500">No obligations yet.</p>
        )}
        {obligations.length > 0 && (
          <ObligationList obligations={obligations} />
        )}
      </div>
    </div>
  );
}