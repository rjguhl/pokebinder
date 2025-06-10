// File: Home.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center px-6">
      <div className="max-w-4xl w-full text-center py-16">
        <h1 className="text-5xl font-extrabold text-indigo-700 mb-6 leading-tight">
          Organize, Track & Showcase <br /> Your Pokémon Card Collection
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Build master sets, explore your collection, and view your binder just like the pros.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/search"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-medium px-6 py-3 rounded-lg shadow"
          >
            Start Searching
          </Link>
          <Link
            to="/collection"
            className="bg-gray-200 hover:bg-gray-300 text-indigo-700 text-lg font-medium px-6 py-3 rounded-lg"
          >
            View Collection
          </Link>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 text-left">
            <h3 className="text-xl font-semibold text-indigo-600 mb-2">Search Cards</h3>
            <p className="text-sm text-gray-600">
              Instantly search thousands of Pokémon cards and filter by set, rarity, and more.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-left">
            <h3 className="text-xl font-semibold text-indigo-600 mb-2">Track Your Binder</h3>
            <p className="text-sm text-gray-600">
              Add cards to your digital binder and visualize your collection like never before.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-left">
            <h3 className="text-xl font-semibold text-indigo-600 mb-2">Build Master Sets</h3>
            <p className="text-sm text-gray-600">
              Choose a Pokémon and generate a complete checklist of every card featuring them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;