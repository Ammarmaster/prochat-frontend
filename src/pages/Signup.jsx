import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userId: '',
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:3000/api/auth/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Enable cookies
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Signup successful');
        navigate('/login');
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="bg-black text-white h-screen flex justify-center items-center font-bold">
      <div className="w-full max-w-sm p-6 bg-gray-900 rounded-lg border border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-center">Signup</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="bg-gray-800 p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            className="bg-gray-800 p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            type="text"
            name="userId"
            placeholder="Username (e.g. jalal123)"
            value={formData.userId}
            onChange={handleChange}
            required
          />

          <input
            className="bg-gray-800 p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            className="bg-gray-800 p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-semibold transition"
          >
            Sign Up
          </button>
        </form>

        {error && <p className="mt-4 text-red-400 text-center">{error}</p>}

        <p className="mt-6 text-sm text-center">
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            className="text-indigo-400 hover:underline cursor-pointer"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
