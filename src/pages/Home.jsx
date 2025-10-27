import React from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import { MessageCircle, Users } from "lucide-react";
import { motion } from "framer-motion";

const Home = () => {
  const navigate = useNavigate();

  const handleStartChat = () => {
    navigate("/chat");
  };

  return (
    <>
      <Nav />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center text-white px-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center max-w-3xl"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              ProChat
            </span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-10">
            A modern real-time chat experience — simple, fast, and beautiful.
            <br />
            Built with ❤️ by{" "}
            <span className="text-blue-400 font-semibold">
              ProDevopz (Mohammd Jalaluddin Yusuf Master)
            </span>
          </p>
        </motion.div>

        {/* Glassmorphic Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-10 w-full max-w-2xl text-center shadow-2xl"
        >
          <p className="text-gray-300 text-lg mb-8">
            Connect with your friends instantly and enjoy seamless, real-time
            messaging across any device. 🚀
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
            <button
              onClick={handleStartChat}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all duration-200 px-6 py-3 rounded-xl text-lg font-semibold shadow-lg hover:shadow-blue-500/20"
            >
              <MessageCircle className="w-5 h-5" />
              Start Chatting
            </button>

            <button
              className="flex items-center gap-2 border border-gray-600 hover:bg-gray-700/50 transition-all duration-200 px-6 py-3 rounded-xl text-lg font-semibold text-gray-300"
              onClick={() => navigate("/chat")}
            >
              <Users className="w-5 h-5 text-blue-400" />
              View Friends
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="mt-20 text-gray-500 text-sm text-center">
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-blue-400">ProChat</span> • Built
          by <a href="https://instagram.com/prodevopz"><span className="font-semibold text-blue-400">ProDevopz</span></a>
        </footer>
      </div>
    </>
  );
};

export default Home;
