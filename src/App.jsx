import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Nav from './components/Nav';
import Login from './pages/Login';
import About from './pages/About';
import Chat from './pages/Chat';
import Contact from './pages/Contact';

const App = () => {
  return (
    <Router>
      <div className=''>
        <div className=''>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/login' element={<Login />} />
            <Route path='/about' element={<About/>} />
            <Route path='/chat' element={<Chat/>} />
            <Route path='/contact' element={<Contact/>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;