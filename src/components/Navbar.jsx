import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from 'react-feather';

const Navbar = () => {
  const { pathname } = useLocation();
  const user = localStorage.getItem('user');

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`px-4 py-2 rounded-md text-sm font-medium transition ${
        pathname === to
          ? 'bg-indigo-600 text-white'
          : 'text-indigo-600 hover:bg-indigo-100'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-indigo-600">
          PokeBinder
        </Link>

        <div className="flex space-x-2 items-center">
          {navLink('/', 'Home')}
          {navLink('/collection', 'Collection')}
          {navLink('/search', 'Search')}

          {!user ? (
            <>
              {navLink('/login', 'Login')}
            </>
          ) : (
            <Link
              to="/profile"
              className="text-indigo-600 hover:bg-indigo-100 p-2 rounded-full"
              title="Profile"
            >
              <User className="w-6 h-6" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;