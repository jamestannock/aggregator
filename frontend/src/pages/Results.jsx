// frontend/src/pages/Results.jsx
import { Link } from "react-router-dom";
import ObligationList from "../components/ObligationList";

export default function Results({ company, obligations }) {
  console.log("Rendering Results with:", { company, obligations });
  if (!company || !obligations) {
    return (
      <p>
        No data, <Link to="/upload">upload first.</Link>
      </p>
    );
  }
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">
        Obligations for <span className="text-blue-700">{company}</span>
      </h2>
      <ObligationList obligations={obligations} />
      <Link to="/upload" className="mt-6 inline-block text-blue-600 hover:underline">
        ← Back to upload
      </Link>
    </>
  );
}