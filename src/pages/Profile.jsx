// File: Profile.jsx

import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FaUserCircle } from 'react-icons/fa';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        getDoc(userRef).then(docSnap => {
          if (docSnap.exists()) {
            setUsername(docSnap.data().username || '');
          }
        });
      }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-4 mb-6">
          <FaUserCircle className="text-indigo-600 text-5xl" />
          <div>
            {username ? (
              <h2 className="text-4xl font-bold text-indigo-700">Hi {username} 👋</h2>
            ) : (
              <div className="h-10 bg-slate-200 rounded w-48 animate-pulse mb-1"></div>
            )}
            <p className="text-gray-600 text-sm mt-1">This is your PokeBinder profile dashboard.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-indigo-600 mb-2">Account Info</h3>
            <p className="text-sm text-gray-700"><strong>Email:</strong> {user.email}</p>
            <p className="text-sm text-gray-700"><strong>UID:</strong> {user.uid}</p>
            {username && <p className="text-sm text-gray-700"><strong>Username:</strong> {username}</p>}
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
