import React from 'react';
import Nav from '../components/Nav';

const Contact = () => {
  return (
    <div>
        <Nav/>
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-white mb-6 border-b border-gray-700 pb-4">
          Contact Me
        </h1>

        <p className="text-gray-400 mb-8">
          Have questions or want to connect? Feel free to reach out using the form below. I'm open to collaboration,
          feedback, or professional opportunities.
        </p>

        <form className="grid grid-cols-1 gap-6">
          <div>
            <label className="block mb-1 text-sm text-gray-300">Your Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-300">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-300">Message</label>
            <textarea
              rows="4"
              className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Type your message..."
            ></textarea>
          </div>

          <div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 transition-colors px-6 py-2 rounded text-white font-medium shadow"
            >
              Send Message
            </button>
          </div>
        </form>

        {/* Optional: Additional Contact Info */}
        <div className="mt-10 text-sm text-gray-400">
          <p>📧 Email: <a href="mailto:your@email.com" className="text-indigo-400 hover:underline">mjyusuf@example.com</a></p>
          <p>💼 LinkedIn: <a href="https://linkedin.com/in/mjyusuf" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">linkedin.com/in/mjyusuf</a></p>
          <p>🐙 GitHub: <a href="https://github.com/mjyusuf" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">github.com/mjyusuf</a></p>
        </div>

        {/* Tech Stack Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">
            🛠 Technologies Used
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 text-gray-300 text-sm">
            <li>⚛️ React</li>
            <li>💬 Socket.IO</li>
            <li>🧠 Zustand</li>
            <li>🌐 Node.js</li>
            <li>🧾 Express.js</li>
            <li>🛡 JWT Auth</li>
            <li>🌱 MongoDB</li>
            <li>🎨 Tailwind CSS</li>
            <li>🎞 Framer Motion</li>
          </ul>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Contact;
