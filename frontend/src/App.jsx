import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Results from "./pages/Results";
import About from "./pages/About";
import { useState } from "react";

export default function App() {
  const [obligations, setObligations] = useState([]);
  const [company, setCompany] = useState("");

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/upload"
            element={
              <Upload
                setObligations={setObligations}
                setCompany={setCompany}
              />
            }
          />
          <Route
            path="/results"
            element={<Results company={company} obligations={obligations} />}
          />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </>
  );
}
