import { useState, useEffect } from "react";
import { discoverRegs } from "../api";

export default function Home() {
  const [companyName, setCompanyName] = useState(
    localStorage.getItem("homeCompanyName") || ""
  );
  const [companyInfo, setCompanyInfo] = useState(
    localStorage.getItem("homeCompanyInfo") || ""
  );
  const [country, setCountry] = useState(
    localStorage.getItem("homeCountry") || "Australia"
  );
  const [savedKey, setSavedKey] = useState(
    localStorage.getItem("homeSavedKey") || ""
  );
  const [regs, setRegs] = useState(
    JSON.parse(localStorage.getItem("homeRegs") || "[]")
  );
  const [message, setMessage] = useState("");

  useEffect(() => localStorage.setItem("homeCompanyName", companyName), [companyName]);
  useEffect(() => localStorage.setItem("homeCompanyInfo", companyInfo), [companyInfo]);
  useEffect(() => localStorage.setItem("homeCountry", country), [country]);
  useEffect(() => {
    if (savedKey) localStorage.setItem("homeSavedKey", savedKey);
    else localStorage.removeItem("homeSavedKey");
  }, [savedKey]);
  useEffect(() => {
    localStorage.setItem("homeRegs", JSON.stringify(regs));
  }, [regs]);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("Saving…");
    try {
      const { key, regulations } = await discoverRegs(
        companyName,
        companyInfo,
        country
      );
      setSavedKey(key);
      setRegs(regulations);
      setMessage(`Saved and loaded ${regulations.length} regulations`);
    } catch (err) {
      console.error(err);
      setMessage("Save failed; check console.");
    }
  };

  const handleRunModel = async () => {
    if (!savedKey) {
      alert("First save your company details to S3.");
      return;
    }
    setMessage("Running model…");
    try {
      const { regulations } = await discoverRegs(
        companyName,
        companyInfo,
        country
      );
      setRegs(regulations);
      setMessage(`Loaded ${regulations.length} regulations`);
    } catch (err) {
      console.error(err);
      setMessage("Model run failed; check console.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Enter Company Details</h1>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Company Name */}
        <div>
          <label className="block mb-1">Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        {/* Company Info */}
        <div>
          <label className="block mb-1">Company Information</label>
          <textarea
            value={companyInfo}
            onChange={(e) => setCompanyInfo(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            rows={4}
            required
          />
        </div>

        {/* Country */}
        <div>
          <label className="block mb-1">Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option>Australia</option>
            <option>United States</option>
            <option>United Kingdom</option>
            <option>Canada</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save to S3
        </button>
      </form>

      {/* Run Model */}
      <button
        onClick={handleRunModel}
        disabled={!savedKey}
        className="w-full mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        Run Model (Get Regulations)
      </button>

      {/* Display status OR actual regulations list */}
      {regs.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Relevant Legislation</h2>
          <ul className="list-disc list-inside space-y-1">
            {regs.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        message && <p className="mt-4 text-center">{message}</p>
      )}
    </div>
  );
}