import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Collection from "./pages/Collection"
import Search from "./pages/Search"
import Navbar from "./components/Navbar"
import Profile from "./pages/Profile"
import MasterSet from "./pages/MasterSet"
import MasterSetView from "./pages/MasterSetView"
import BinderBuilder from "./pages/BinderBuilder"
import BinderViewer from "./pages/BinderViewer"

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
        <Route path="/binder-builder" element={<BinderBuilder />} />
        <Route path="/binder/:binderId" element={<BinderViewer />} />
      </Routes>
    </>
  )
}

export default App
