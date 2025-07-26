"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { Menu, X, User, LogOut, Home, Search, Grid, BookOpen, Zap } from "lucide-react"

const Navbar = () => {
  const [user, setUser] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })
    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      navigate("/")
      setShowUserMenu(false)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Search", path: "/search", icon: Search },
    { name: "Collection", path: "/collection", icon: Grid },
    { name: "Master Sets", path: "/masterset", icon: Zap },
    { name: "Binder Builder", path: "/binder-builder", icon: BookOpen },
  ]

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true
    if (path !== "/" && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <nav className="sticky top-0 z-50 glass-white border-b border-white/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 neon-blue">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PokéBinder
              </h1>
              <p className="text-xs text-slate-500 font-medium">Organize Your Collection</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                    isActive(item.path)
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg neon-blue"
                      : "text-slate-700 hover:bg-white/60 hover:shadow-md"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl glass hover:bg-white/60 transition-all duration-300 hover:shadow-md"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <span className="hidden sm:block font-semibold text-slate-700">
                    {user.displayName || user.email?.split("@")[0]}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 glass-white rounded-2xl shadow-xl border border-white/20 py-2">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-white/60 transition-colors duration-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User size={16} />
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 neon-blue"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-3 rounded-2xl glass hover:bg-white/60 transition-all duration-300"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/20">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                      isActive(item.path)
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                        : "text-slate-700 hover:bg-white/60"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
