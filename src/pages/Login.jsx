import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formdata, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formdata,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('https://prochat-api.onrender.com/api/auth/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formdata),
        credentials: 'include', // Send cookies (important for JWT cookies)
      });

      const data = await res.json();

      if (res.ok) {
        // Optional: Save token to localStorage if you return it
        // localStorage.setItem('token', data.token);

        
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred.');
    }
  };

  return (
    <div className="bg-black text-white h-screen flex flex-col justify-center items-center gap-5">
      <div className="w-full max-w-sm p-10 bg-black rounded-lg border border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            type="email"
            name="email"
            placeholder="Email"
            value={formdata.email}
            onChange={handleChange}
            required
          />

          <input
            className="p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            type="password"
            name="password"
            placeholder="Password"
            value={formdata.password}
            onChange={handleChange}
            required
          />

          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-semibold transition"
            type="submit"
          >
            Login
          </button>
        </form>

        {error && (
          <p className="mt-4 text-red-400 text-center font-medium">{error}</p>
        )}

        <p className="mt-6 text-sm text-center">
          Don't have an account?{' '}
          <span
            onClick={() => navigate('/signup')}
            className="text-indigo-400 hover:underline cursor-pointer"
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
