import { Link } from "react-router-dom";
import ObligationList from "../components/ObligationList";

export default function Results({ company, obligations }) {
  if (!company)
    return (
      <p>
        No data, <Link to="/upload" className="text-blue-600">upload first.</Link>
      </p>
    );
  return (
    <>
      <h2 className="text-3xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
        Obligations for <span>{company}</span>
      </h2>
      <ObligationList obligations={obligations} />
      <Link
        to="/upload"
        className="mt-6 inline-block text-blue-600 hover:text-purple-600 font-medium"
      >
        ← Back to upload
      </Link>
    </>
  );
}
