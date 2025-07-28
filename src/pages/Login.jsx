"use client"

import { useState } from "react"
import { auth } from "../firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
} from "firebase/auth"
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../firebase"
import { Mail, Lock, Eye, EyeOff, Sparkles, Zap } from "lucide-react"

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false)
  const [tempUser, setTempUser] = useState(null)
  const [usernameInput, setUsernameInput] = useState("")
  const [usernameError, setUsernameError] = useState("")

  const toggleSignUp = () => {
    setIsSignUp((prev) => !prev)
    setEmail("")
    setPassword("")
    setError("")
  }

  const formatFirebaseError = (code) => {
    switch (code) {
      case "auth/user-not-found":
        return "No account found with this email."
      case "auth/wrong-password":
        return "Incorrect password."
      case "auth/email-already-in-use":
        return "An account with this email already exists."
      case "auth/invalid-email":
        return "Invalid email address."
      case "auth/invalid-credential":
        return "Invalid login credentials."
      case "auth/too-many-requests":
        return "Too many login attempts. Please try again later."
      case "auth/popup-closed-by-user":
        return "Google login was closed before completion."
      case "auth/popup-blocked":
        return "Popup blocked by the browser. Please allow popups and try again."
      default:
        return "Something went wrong. Please try again."
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isSignUp) {
        const methods = await fetchSignInMethodsForEmail(auth, email)
        if (methods.length > 0) {
          setError("An account with this email already exists.")
          return
        }
        const userCred = await createUserWithEmailAndPassword(auth, email, password)
        setTempUser(userCred.user)
        setShowUsernamePrompt(true)
        return
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        localStorage.setItem("user", email)
        window.location.href = "/profile"
      }
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Please log in instead.")
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters long.")
      } else if (err.code === "auth/invalid-email") {
        setError("The email address is not valid.")
      } else {
        setError(formatFirebaseError(err.code))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    setLoading(true)

    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        setTempUser(user)
        setShowUsernamePrompt(true)
        return
      }

      localStorage.setItem("user", user.uid)
      window.location.href = "/profile"
    } catch (err) {
      setError(formatFirebaseError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleUsernameSubmit = async () => {
    setUsernameError("")
    setLoading(true)
    if (usernameInput.trim().length < 2) {
      setUsernameError("Username must be at least 2 characters.")
      setLoading(false)
      return
    }

    const usernameTaken = await getDocs(query(collection(db, "users"), where("username", "==", usernameInput.trim())))

    if (!usernameTaken.empty) {
      setUsernameError("Username is already taken.")
      setLoading(false)
      return
    }

    try {
      const userRef = doc(db, "users", tempUser.uid)
      console.log("Setting doc for user:", tempUser.uid)
      await setDoc(userRef, {
        uid: tempUser.uid,
        email: tempUser.email,
        username: usernameInput.trim(),
        createdAt: new Date(),
        binders: [],
      })

      localStorage.setItem("user", tempUser.uid)
      window.location.href = "/profile"
    } catch (err) {
      setUsernameError("Failed to save username.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <div
        className={`w-full max-w-6xl grid ${isSignUp ? "lg:grid-cols-1" : "lg:grid-cols-2"} bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100`}
      >
        {/* Form Section */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="text-center mb-8 animate-fadeInUp">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              {isSignUp ? "Create Account" : "Sign In"}
            </h2>
            <p className="text-gray-600">
              {isSignUp ? "Start your Pokémon card collection journey today" : "Continue managing your collection"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 animate-fadeInUp">
            {/* Email Input */}
            <div className="relative">
              <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 animate-fadeInUp">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  {isSignUp ? "Creating Account..." : "Signing In..."}
                </div>
              ) : isSignUp ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Google Login */}
          <div className="mt-6 animate-fadeInUp">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-3 bg-white text-gray-800 border-2 border-gray-200 rounded-2xl py-4 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Continue with Google
            </button>
          </div>

          {/* Toggle Sign Up/Login */}
          <p className="text-center mt-8 text-gray-600 animate-fadeInUp">
            {isSignUp ? "Already have an account?" : "New to PokéMaster?"}{" "}
            <button
              onClick={toggleSignUp}
              className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
            >
              {isSignUp ? "Sign In" : "Create Account"}
            </button>
          </p>
        </div>

        {/* Hero Section - Only show when not signing up */}
        {!isSignUp && (
          <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative text-center animate-fadeInUp">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <Zap size={40} className="text-white" />
              </div>
              <h3 className="text-4xl font-black mb-6">PokéMaster</h3>
              <p className="text-xl mb-4 opacity-90">The ultimate platform for Pokémon card collectors</p>
              <p className="text-lg opacity-75 leading-relaxed">
                Track your collection, build master sets, and connect with trainers worldwide
              </p>

              {/* Floating Elements */}
              <div
                className="absolute top-10 left-10 w-16 h-20 bg-white/10 rounded-lg animate-bounce opacity-50"
                style={{ animationDelay: "0s" }}
              />
              <div
                className="absolute bottom-20 right-10 w-12 h-16 bg-white/10 rounded-lg animate-bounce opacity-50"
                style={{ animationDelay: "1s" }}
              />
              <div
                className="absolute top-1/2 left-5 w-10 h-14 bg-white/10 rounded-lg animate-bounce opacity-50"
                style={{ animationDelay: "2s" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Username Prompt Modal */}
      {showUsernamePrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-fadeInUp">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={24} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Username</h2>
              <p className="text-gray-600">This will be your unique identifier in the community</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300"
              />

              {usernameError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3">
                  <p className="text-red-600 text-sm font-medium">{usernameError}</p>
                </div>
              )}

              <button
                onClick={handleUsernameSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50"
              >
                Complete Setup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
