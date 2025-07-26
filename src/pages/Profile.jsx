"use client"

import { useEffect, useState } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import {
  User,
  LogOut,
  Calendar,
  Trophy,
  Star,
  TrendingUp,
  Grid,
  Target,
  Award,
  Clock,
  Sparkles,
  BarChart3,
  Zap,
} from "lucide-react"

const Profile = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [userStats, setUserStats] = useState({
    totalCards: 0,
    uniqueCards: 0,
    masterSets: 0,
    customBinders: 0,
    joinDate: null,
    lastActive: null,
    favoriteSet: "",
    totalValue: 0,
    recentActivity: [],
  })
  const [achievements, setAchievements] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setLoading(false)
      if (currentUser) {
        await loadUserData(currentUser.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  const loadUserData = async (uid) => {
    try {
      // Load user profile
      const userRef = doc(db, "users", uid)
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUsername(userData.username || "")
        setUserStats((prev) => ({
          ...prev,
          joinDate: userData.createdAt?.toDate() || new Date(),
          lastActive: userData.lastActive?.toDate() || new Date(),
        }))
      }

      // Load collection stats
      const collectionRef = collection(db, "users", uid, "collection")
      const collectionSnap = await getDocs(collectionRef)
      let totalCards = 0
      const uniqueCards = collectionSnap.size
      const setCount = new Map()

      collectionSnap.forEach((doc) => {
        const data = doc.data()
        const subTypes = data.subTypes || []
        subTypes.forEach((subType) => {
          if (subType.owned) totalCards++
        })

        // Count cards per set for favorite set
        const setName = data.set || "Unknown"
        setCount.set(setName, (setCount.get(setName) || 0) + 1)
      })

      // Find favorite set
      let favoriteSet = ""
      let maxCount = 0
      setCount.forEach((count, setName) => {
        if (count > maxCount) {
          maxCount = count
          favoriteSet = setName
        }
      })

      // Load master sets
      const masterSetsRef = collection(db, "users", uid, "mastersets")
      const masterSetsSnap = await getDocs(masterSetsRef)

      // Load custom binders
      const bindersRef = collection(db, "users", uid, "binders")
      const bindersSnap = await getDocs(bindersRef)

      // Load recent activity
      const activityRef = collection(db, "users", uid, "activity")
      const activityQuery = query(activityRef, orderBy("timestamp", "desc"), limit(5))
      const activitySnap = await getDocs(activityQuery)
      const recentActivity = activitySnap.docs.map((doc) => doc.data())

      setUserStats((prev) => ({
        ...prev,
        totalCards,
        uniqueCards,
        masterSets: masterSetsSnap.size,
        customBinders: bindersSnap.size,
        favoriteSet,
        totalValue: Math.floor(Math.random() * 5000) + 1000, // Placeholder
        recentActivity,
      }))

      // Calculate achievements
      const newAchievements = []
      if (totalCards >= 100) newAchievements.push({ name: "Collector", description: "Own 100+ cards", icon: Trophy })
      if (totalCards >= 500)
        newAchievements.push({ name: "Master Collector", description: "Own 500+ cards", icon: Award })
      if (masterSetsSnap.size >= 5)
        newAchievements.push({ name: "Set Master", description: "Create 5+ master sets", icon: Target })
      if (bindersSnap.size >= 3)
        newAchievements.push({ name: "Organizer", description: "Create 3+ custom binders", icon: Grid })

      setAchievements(newAchievements)
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-200 to-red-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You must be logged in to view this page</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  const statCards = [
    { icon: Grid, label: "Total Cards", value: userStats.totalCards, color: "from-blue-500 to-cyan-500" },
    { icon: Star, label: "Unique Cards", value: userStats.uniqueCards, color: "from-purple-500 to-pink-500" },
    { icon: Target, label: "Master Sets", value: userStats.masterSets, color: "from-orange-500 to-red-500" },
    {
      icon: TrendingUp,
      label: "Est. Value",
      value: `$${userStats.totalValue}`,
      color: "from-green-500 to-emerald-500",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 px-4 py-2 rounded-full text-sm font-medium text-indigo-700 mb-4">
            <Sparkles size={16} className="animate-pulse" />
            Your Profile Dashboard
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {username || "Trainer"}
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track your collection progress and manage your Pokémon card journey
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8 animate-fadeInUp">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <User size={40} className="text-white" />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{username || "Anonymous Trainer"}</h2>
              <p className="text-gray-600 mb-4">{user.email}</p>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  Joined {userStats.joinDate?.toLocaleDateString() || "Recently"}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  Last active {userStats.lastActive?.toLocaleDateString() || "Today"}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fadeInUp">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl mb-4 shadow-lg`}
              >
                <stat.icon size={24} className="text-white" />
              </div>
              <div className="text-2xl font-black text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Achievements */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-fadeInUp">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
                <Award size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Achievements</h3>
                <p className="text-gray-600">Your collection milestones</p>
              </div>
            </div>

            {achievements.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy size={24} className="text-gray-500" />
                </div>
                <p className="text-gray-500">Start collecting to unlock achievements!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <achievement.icon size={20} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{achievement.name}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Collection Insights */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-fadeInUp">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <BarChart3 size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Collection Insights</h3>
                <p className="text-gray-600">Your collecting patterns</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">Favorite Set</span>
                  <Star size={16} className="text-yellow-500" />
                </div>
                <p className="text-lg font-bold text-gray-900">{userStats.favoriteSet || "No favorite yet"}</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">Collection Value</span>
                  <TrendingUp size={16} className="text-green-500" />
                </div>
                <p className="text-lg font-bold text-gray-900">${userStats.totalValue}</p>
                <p className="text-sm text-gray-600">Estimated market value</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">Custom Binders</span>
                  <Grid size={16} className="text-purple-500" />
                </div>
                <p className="text-lg font-bold text-gray-900">{userStats.customBinders}</p>
                <p className="text-sm text-gray-600">Personal collections</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 animate-fadeInUp">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate("/collection")}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Grid size={24} className="text-white" />
              </div>
              <span className="font-medium text-gray-900">View Collection</span>
            </button>

            <button
              onClick={() => navigate("/masterset")}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Zap size={24} className="text-white" />
              </div>
              <span className="font-medium text-gray-900">Master Sets</span>
            </button>

            <button
              onClick={() => navigate("/search")}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Star size={24} className="text-white" />
              </div>
              <span className="font-medium text-gray-900">Search Cards</span>
            </button>

            <button
              onClick={() => navigate("/binder-builder")}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Target size={24} className="text-white" />
              </div>
              <span className="font-medium text-gray-900">Create Binder</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
