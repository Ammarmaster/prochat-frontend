import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Nav = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const res = await fetch("https://prochat-api.onrender.com/api/auth/user/logout", {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="bg-[#1c1c1c] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Branding */}
          <div className="text-xl font-extrabold tracking-wide">ProChat</div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6 font-semibold">
            <Link to="/" className="hover:text-gray-400 transition">Home</Link>
            <Link to="/chat" className="hover:text-gray-400 transition">Chat</Link>
            <Link to="/contact" className="hover:text-gray-400 transition">Contact</Link>
            <Link to="/about" className="hover:text-gray-400 transition">About Us</Link>
            <button onClick={handleLogout} className="hover:text-red-400 transition">Logout</button>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-300 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={
                    menuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden flex flex-col items-center bg-[#111] border-t border-gray-700 pb-4 space-y-3 mt-2">
            <Link onClick={() => setMenuOpen(false)} to="/" className="hover:text-gray-400">Home</Link>
            <Link onClick={() => setMenuOpen(false)} to="/chat" className="hover:text-gray-400">Chat</Link>
            <Link onClick={() => setMenuOpen(false)} to="/contact" className="hover:text-gray-400">Contact</Link>
            <Link onClick={() => setMenuOpen(false)} to="/about" className="hover:text-gray-400">About Us</Link>
            <button onClick={handleLogout} className="hover:text-red-400">Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Nav;
