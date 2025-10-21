import React from 'react';
import Nav from '../components/Nav';

const About = () => {
  return (
    <div><Nav />
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full bg-gray-800 p-8 rounded-xl shadow-lg">
        <h1 className="text-4xl font-bold text-white mb-6 border-b border-gray-700 pb-4">
          About This Chat App
        </h1>

        <p className="text-lg text-gray-300 mb-4">
          Hi, I'm <span className="text-indigo-400 font-semibold">MohammadJalaluddin Yusuf</span>, 
          a tech enthusiast and Master's graduate in Computer Applications (MCA) with a CGPA of <span className="text-green-400 font-semibold">8.3</span>.
        </p>

        <p className="text-lg text-gray-300 mb-4">
          This real-time chat application was built as a portfolio project to showcase my full-stack skills using
          <span className="text-blue-400 font-medium"> React</span>, 
          <span className="text-yellow-400 font-medium"> Node.js</span>, 
          <span className="text-pink-400 font-medium"> Socket.IO</span>, and 
          <span className="text-purple-400 font-medium"> Express</span>.
        </p>

        <p className="text-lg text-gray-300 mb-4">
          It enables users to send and receive messages instantly with a smooth and responsive UI. The app also supports real-time updates and efficient communication channels.
        </p>

        <p className="text-lg text-gray-300 mb-4">
          My goal with this project was not only to build something functional but also to demonstrate how design, performance, and modern web technologies can come together in a single product.
        </p>

        <p className="text-lg text-gray-300 mb-4">
          Thank you for taking the time to explore it!
        </p>

        <div className="mt-8 text-right text-sm text-gray-500 italic">
          — MohammadJalaluddin Yusuf
        </div>
      </div>
    </div>
    </div>
  );
};

export default About;
