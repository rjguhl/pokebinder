// File: App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Collection from './pages/Collection';
import Search from './pages/Search';
import Navbar from './components/Navbar';
import Profile from './pages/Profile';
import MasterSet from './pages/MasterSet';
import MasterSetView from './pages/MasterSetView';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/search" element={<Search />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/masterset" element={<MasterSet />} />
        <Route path="/mastersets/:id/view" element={<MasterSetView />} />
      </Routes>
    </>
  );
}

export default App;