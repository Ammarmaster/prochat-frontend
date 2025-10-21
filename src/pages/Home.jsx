import React from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';

const Home = () => {
   

    return (
        <>
         <Nav />
        <div className='bg-gray-700 h-screen'>
          
        <div>
            <h1 className='text-white text-4xl font-bold flex justify-center items-center mt-20'>Welcome to the Home Page</h1>
        </div>
        </div>
        </>
    );
};

export default Home;