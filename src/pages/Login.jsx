import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Nav from "../components/Nav";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "https://prochat-api.onrender.com/api/auth/user/login",
        formData,
        { withCredentials: true }
      );

      // ✅ Handle success (whether backend returns success, token, or 200 OK)
      if (res.status === 200) {
        // Optional: store token if backend sends it
        if (res.data?.token) {
          localStorage.setItem("token", res.data.token);
        }

        // ✅ Redirect user to homepage
        navigate("/");
      } else {
        setError(res.data?.message || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || "Something went wrong. Try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Nav />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center px-6 text-white">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl p-8"
        >
          {/* Title */}
          <h2 className="text-3xl font-bold text-center mb-2">
            Welcome back to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              ProChat
            </span>
          </h2>
          <p className="text-gray-400 text-center mb-8">
            Developed by{" "}
            <span className="text-blue-400 font-semibold">
              ProDevopz (Mohammd Jalaluddin Yusuf Master)
            </span>
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm mb-2 text-gray-300">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-300">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all py-3 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20"
            >
              <LogIn className="w-5 h-5" />
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-gray-400 text-sm text-center mt-6">
            Don’t have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-blue-400 hover:underline font-medium"
            >
              Sign up
            </button>
          </p>
        </motion.div>

        <footer className="mt-10 text-gray-500 text-sm text-center">
          © {new Date().getFullYear()} ProChat • Built by{" "}
          <span className="text-blue-400 font-semibold">ProDevopz</span>
        </footer>
      </div>
    </>
  );
};

export default Login;
