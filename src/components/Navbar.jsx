"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "../firebase"
import {
  Search,
  User,
  LogOut,
  Menu,
  X,
  Home,
  ShoppingBasketIcon as Collection,
  BookOpen,
  Zap,
  ChevronDown,
} from "lucide-react"

const Navbar = () => {
  const [user, setUser] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setShowProfileDropdown(false)
      setIsMenuOpen(false)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Search", path: "/search", icon: Search },
    { name: "Collection", path: "/collection", icon: Collection },
    { name: "Master Sets", path: "/masterset", icon: Zap },
    { name: "Binders", path: "/binder-builder", icon: BookOpen },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 glass backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 neon-blue">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PokéBinder
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                    isActive(item.path)
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg neon-blue"
                      : "text-slate-700 hover:text-blue-600 hover:bg-white/50"
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center">
            {user ? (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowProfileDropdown(true)}
                  onMouseLeave={() => setShowProfileDropdown(false)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                    isActive("/profile")
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg neon-blue"
                      : "text-slate-700 hover:text-blue-600 hover:bg-white/50"
                  }`}
                >
                  <User size={18} />
                  Profile
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${showProfileDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div
                    className="absolute right-0 top-full mt-2 w-56 glass-white rounded-2xl shadow-xl border border-white/20 py-3 z-50"
                    onMouseEnter={() => setShowProfileDropdown(true)}
                    onMouseLeave={() => setShowProfileDropdown(false)}
                  >
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-6 py-3 text-slate-700 hover:bg-blue-50 transition-colors duration-200 rounded-xl mx-2"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <User size={18} />
                      View Profile
                    </Link>
                    <hr className="my-2 border-slate-200 mx-4" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-6 py-3 text-red-600 hover:bg-red-50 transition-colors duration-200 rounded-xl mx-2"
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 neon-blue"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-3 rounded-2xl text-slate-700 hover:bg-white/50 transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-white/20">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                      isActive(item.path)
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                        : "text-slate-700 hover:bg-white/50"
                    }`}
                  >
                    <Icon size={20} />
                    {item.name}
                  </Link>
                )
              })}

              <div className="border-t border-slate-200 mt-4 pt-4">
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                        isActive("/profile")
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                          : "text-slate-700 hover:bg-white/50"
                      }`}
                    >
                      <User size={20} />
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-red-600 hover:bg-red-50 transition-all duration-300"
                    >
                      <LogOut size={20} />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-2xl font-semibold text-center transition-all duration-300"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
