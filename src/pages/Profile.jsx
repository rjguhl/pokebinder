// File: Profile.jsx

import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-red-500">You must be logged in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
        <h2 className="text-3xl font-bold text-indigo-700 mb-4">Welcome back, {user.displayName || user.email}!</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-slate-50 border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-indigo-600 mb-2">Account Info</h3>
            <p className="text-sm text-gray-700"><strong>Email:</strong> {user.email}</p>
            <p className="text-sm text-gray-700"><strong>UID:</strong> {user.uid}</p>
          </div>

          <div className="bg-slate-50 border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-indigo-600 mb-2">Quick Actions</h3>
            <button
              onClick={() => navigate('/collection')}
              className="w-full bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600 mb-2"
            >
              View Your Collection
            </button>
            <button
              onClick={() => navigate('/masterset')}
              className="w-full bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600 mb-2"
            >
              Build a Master Set
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
