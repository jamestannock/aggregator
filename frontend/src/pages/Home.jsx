import { Link } from "react-router-dom";
export default function Home() {
  return (
    <div className="text-center space-y-6 py-12">
      <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
        Welcome to Aggregator
      </h1>
      <p className="text-lg text-gray-700">
        Upload legislation PDFs and get compliance obligations.
      </p>
      <Link
        to="/upload"
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg shadow-lg hover:opacity-90"
      >
        Get Started
      </Link>
    </div>
  );
}
