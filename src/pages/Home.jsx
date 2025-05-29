import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-100 flex flex-col items-center justify-center px-6 py-20 text-center">
      <h1 className="text-5xl font-extrabold text-gray-800 mb-6">
        Build Your Ultimate Pokémon Master Set
      </h1>
      <p className="text-lg text-gray-600 max-w-xl mb-10">
        Track, manage, and show off your personalized Pokémon collections – from vintage first editions to the latest Scarlet & Violet sets.
      </p>
      <Link
        to="/signup"
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg"
      >
        Get Started
      </Link>
    </div>
  );
};

export default Home;