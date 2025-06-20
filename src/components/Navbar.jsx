// File: Navbar.jsx

import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const Navbar = () => {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`px-4 py-2 rounded-md text-sm font-medium transition ${
        pathname === to ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-100'
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
        <div className="flex space-x-2">
          {navLink('/', 'Home')}
          {navLink('/collection', 'Collection')}
          {navLink('/search', 'Search')}
          {user ? navLink('/profile', 'Profile') : navLink('/login', 'Login')}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;