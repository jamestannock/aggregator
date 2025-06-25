import { Link } from "react-router-dom";
export default function Home() {
  return (
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-bold">Welcome to Aggregator</h1>
      <p className="text-lg text-gray-600">
        Upload legislation PDFs and get compliance obligations.
      </p>
      <Link
        to="/upload"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        Get Started
      </Link>
    </div>
  );
}
