import { NavLink } from "react-router-dom";

export default function Navbar() {
  const linkCls = "hover:text-blue-600 px-2 py-1 rounded";
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between">
        <NavLink to="/" className="font-bold text-xl">
          Aggregator
        </NavLink>
        <div className="space-x-4">
          <NavLink to="/" className={linkCls}>Home</NavLink>
          <NavLink to="/upload" className={linkCls}>Upload</NavLink>
          <NavLink to="/about" className={linkCls}>About</NavLink>
        </div>
      </div>
    </nav>
  );
}
