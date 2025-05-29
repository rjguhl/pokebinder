import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Collection from './pages/Collection';
import Search from './pages/Search';
import Navbar from './components/Navbar';
import MasterSets from './pages/MasterSets';
import NewMasterSet from './pages/NewMasterSet';
import MasterSetView from './pages/MasterSetView';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/search" element={<Search />} />
        <Route path="/mastersets" element={<MasterSets />} />
        <Route path="/mastersets/new" element={<NewMasterSet />} />
        <Route path="/mastersets/:id" element={<MasterSetView />} />
      </Routes>
    </>
  );
}

export default App;
