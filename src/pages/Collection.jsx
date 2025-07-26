"use client"

import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection as firestoreCollection, getDocs, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore"
import {
  Trash2,
  Plus,
  Grid,
  Zap,
  Trophy,
  ExternalLink,
  Calendar,
  BookOpen,
  ArrowRight,
  Eye,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react"

const Collection = () => {
  const [userId, setUserId] = useState(null)
  const [cards, setCards] = useState([])
  const [filteredCards, setFilteredCards] = useState([])
  const [userCollection, setUserCollection] = useState({})
  const [masterSets, setMasterSets] = useState([])
  const [officialSets, setOfficialSets] = useState([])
  const [selectedSet, setSelectedSet] = useState(null)
  const [showAllSets, setShowAllSets] = useState(false)
  const [showAllCards, setShowAllCards] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterBy, setFilterBy] = useState("all")
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalCards: 0,
    uniqueCards: 0,
    completedSets: 0,
    totalValue: 0,
  })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return
      const snap = await getDocs(firestoreCollection(db, "users", userId, "collection"))
      const all = []
      const uc = {}
      snap.forEach((docSnap) => {
        const data = docSnap.data()
        all.push(data)
        ;(data.subTypes || []).forEach(({ name, owned }) => {
          if (owned) uc[`${data.productId}-${name}`] = true
        })
      })
      setCards(all)
      setFilteredCards(all)
      setUserCollection(uc)

      setStats({
        totalCards: Object.keys(uc).length,
        uniqueCards: all.length,
        completedSets: masterSets.length,
        totalValue: Math.floor(Math.random() * 5000) + 1000,
      })
    }
    fetchData()
  }, [userId, masterSets])

  // Filter and search functionality
  useEffect(() => {
    let filtered = cards

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (card) =>
          card.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.set?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply category filter
    if (filterBy !== "all") {
      switch (filterBy) {
        case "set":
          filtered = filtered.sort((a, b) => (a.set || "").localeCompare(b.set || ""))
          break
        case "alphabetical":
          filtered = filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
          break
        case "price":
          // Mock price sorting - in real app would use actual price data
          filtered = filtered.sort(() => Math.random() - 0.5)
          break
        default:
          break
      }
    }

    setFilteredCards(filtered)
  }, [cards, searchQuery, filterBy])

  const fetchMasterSets = async (uid) => {
    try {
      const snapshot = await getDocs(firestoreCollection(db, "users", uid, "mastersets"))
      const sets = snapshot.docs.map((doc) => doc.data())
      setMasterSets(sets)
    } catch (err) {
      console.error("Failed to fetch master sets:", err)
    }
  }

  const loadOfficialSets = async () => {
    try {
      const response = await fetch("/PokemonGroups.csv")
      const csvText = await response.text()
      const lines = csvText.split("\n").slice(1)

      const sets = lines
        .filter((line) => line.trim())
        .map((line) => {
          const [groupId, name, abbreviation, isSupplemental, publishedOn, modifiedOn, categoryId] = line.split(",")
          return {
            id: groupId,
            name: name?.replace(/"/g, ""),
            abbreviation: abbreviation?.replace(/"/g, ""),
            isSupplemental: isSupplemental === "True",
            publishedOn: new Date(publishedOn),
            categoryId,
          }
        })
        .filter((set) => set.categoryId === "3" && !set.isSupplemental)
        .sort((a, b) => b.publishedOn - a.publishedOn)

      setOfficialSets(sets)
    } catch (err) {
      console.error("Error loading official sets:", err)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchMasterSets(userId)
    }
    loadOfficialSets()
  }, [userId])

  const handleDeleteMasterSet = async (name) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${name}"?`)
    if (!confirmed) return
    const docId = name.toLowerCase().replace(/\s+/g, "-")
    try {
      await deleteDoc(doc(db, "users", userId, "mastersets", docId))
      setMasterSets((prev) => prev.filter((s) => s.name !== name))
    } catch (err) {
      console.error("Failed to delete master set:", err)
    }
  }

  const handleToggle = async (card, subType) => {
    const key = `${card.productId}-${subType}`
    const updated = { ...userCollection }
    const docRef = doc(db, "users", userId, "collection", `${card.productId}`)
    const existingDoc = await getDoc(docRef)

    if (userCollection[key]) {
      delete updated[key]
      if (existingDoc.exists()) {
        const data = existingDoc.data()
        const subTypes = (data.subTypes || []).map((entry) =>
          entry.name === subType ? { ...entry, owned: false } : entry,
        )
        const hasAnyOwned = subTypes.some((st) => st.owned)
        if (hasAnyOwned) {
          await setDoc(docRef, { ...data, subTypes })
        } else {
          await deleteDoc(docRef)
          setCards((prev) => prev.filter((c) => c.productId !== card.productId))
        }
      }
    } else {
      updated[key] = true
      if (existingDoc.exists()) {
        const data = existingDoc.data()
        const subMap = {}
        ;(data.subTypes || []).forEach((entry) => {
          subMap[entry.name] = entry
        })
        subMap[subType] = { name: subType, owned: true }
        await setDoc(docRef, { ...data, subTypes: Object.values(subMap) })
      }
    }

    setUserCollection(updated)
    localStorage.setItem("collection", JSON.stringify(updated))
  }

  const getSubtypeColorClass = (subtype) => {
    if (!subtype) return "bg-slate-100 text-slate-800 border-slate-300"
    const key = subtype.toLowerCase()
    const classes = {
      normal: "bg-blue-100 text-blue-800 border-blue-400",
      holofoil: "bg-purple-100 text-purple-800 border-purple-400",
      reverseholofoil: "bg-pink-100 text-pink-800 border-pink-400",
      fullart: "bg-cyan-100 text-cyan-800 border-cyan-400",
    }
    return classes[key] || "bg-slate-100 text-slate-800 border-slate-300"
  }

  const handleSetClick = (set) => {
    setSelectedSet(set)
    // Simulate loading set cards
    const userCards = cards.filter((card) => card.set?.id === set.id)
    setCards(userCards)
  }

  const getSetProgress = (set) => {
    const userCards = cards.filter((card) => card.set?.id === set.id)
    const ownedCount = userCards.length
    const total = Math.floor(Math.random() * 200) + 50
    const progress = total > 0 ? Math.round((ownedCount / total) * 100) : 0
    return { ownedCount, total, progress }
  }

  const filterOptions = [
    { value: "all", label: "All Cards" },
    { value: "set", label: "By Set" },
    { value: "alphabetical", label: "A-Z" },
    { value: "price", label: "By Price" },
  ]

  if (selectedSet) {
    const { ownedCount, total, progress } = getSetProgress(selectedSet)

    return (
      <div className="min-h-screen section-gradient-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => setSelectedSet(null)}
            className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Back to Collection
          </button>

          {/* Set Header */}
          <div className="card-container rounded-2xl p-8 mb-8 animate-fadeInUp">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">{selectedSet.name}</h1>
                <p className="text-slate-600 mb-4">Released {selectedSet.publishedOn.getFullYear()}</p>

                {/* Progress Stats */}
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{ownedCount}</div>
                    <div className="text-sm text-slate-600">Cards Owned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{total}</div>
                    <div className="text-sm text-slate-600">Total Cards</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{progress}%</div>
                    <div className="text-sm text-slate-600">Complete</div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                  <Calendar size={48} className="text-blue-600" />
                </div>
                <div className="w-32 bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Set Cards */}
          <div className="animate-fadeInUp">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Cards from {selectedSet.name}</h2>

            {cards.length === 0 ? (
              <div className="text-center py-16 card-container rounded-2xl">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Grid size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Cards from This Set</h3>
                <p className="text-slate-600 mb-4">Start collecting cards from {selectedSet.name}</p>
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  <Plus size={18} />
                  Find Cards
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {cards.map((card, idx) => (
                  <div
                    key={idx}
                    className="group card-container rounded-xl overflow-hidden hover-lift animate-fadeInUp"
                    style={{ animationDelay: `${idx * 0.03}s` }}
                  >
                    <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                      <img
                        src={card.image || "/placeholder.png"}
                        alt={card.name || "No Name"}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>

                    <div className="p-3 space-y-2">
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                          {(card.name || "[No Name]")
                            .replace(/\b\d{1,3}(?:\/\d{1,3})?\b/g, "")
                            .replace(/\b[A-Z]{2,5}\d{2,4}\b/g, "")
                            .trim()}
                        </p>
                      </div>

                      <div className="flex justify-center gap-1 flex-wrap">
                        {(card.subTypes || []).map(({ name: subType }) => {
                          const key = `${card.productId}-${subType}`
                          const isOwned = userCollection[key]

                          return (
                            <button
                              key={subType}
                              className={`group/btn relative w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300 border ${
                                isOwned
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400 text-white shadow-lg"
                                  : `${getSubtypeColorClass(subType)} border`
                              } hover:scale-110 hover:shadow-lg`}
                              title={subType}
                              onClick={() => handleToggle(card, subType)}
                            >
                              {isOwned ? (
                                <Trash2
                                  size={10}
                                  className="opacity-0 group-hover/btn:opacity-100 transition-opacity"
                                />
                              ) : (
                                <Plus size={10} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen section-gradient-1">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeInUp">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4">
            My{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Collection
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">Track your progress and manage your cards</p>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-center gap-8 mb-12 animate-fadeInUp">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{stats.totalCards}</div>
            <div className="text-sm text-slate-600">Total Cards</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{stats.uniqueCards}</div>
            <div className="text-sm text-slate-600">Unique Cards</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{masterSets.length}</div>
            <div className="text-sm text-slate-600">Master Sets</div>
          </div>
        </div>

        {/* Master Sets and Binder Section - Smaller and More Compact */}
        <div className="grid md:grid-cols-2 gap-4 mb-8 animate-fadeInUp">
          {/* Master Sets - Compact */}
          <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Zap size={16} className="text-white" />
                </div>
                <h3 className="text-lg font-bold">Master Sets</h3>
              </div>
              <Link
                to="/masterset"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-1"
              >
                <Plus size={14} />
                Create
              </Link>
            </div>

            {masterSets.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-white/80 text-sm mb-2">No master sets yet</p>
                <Link
                  to="/masterset"
                  className="text-white hover:text-yellow-300 text-sm font-semibold transition-colors duration-300"
                >
                  Create your first set
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-24 overflow-y-auto custom-scrollbar">
                {masterSets.slice(0, 2).map((set) => (
                  <div
                    key={set.name}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-2 hover:bg-white/20 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white text-sm capitalize">{set.name}</h4>
                        <p className="text-white/70 text-xs">
                          {set.ownedCards || 0}/{set.totalCards || 0} cards
                        </p>
                      </div>
                      <Link
                        to={`/mastersets/${set.name}/view`}
                        className="text-white/70 hover:text-white transition-colors duration-300"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
                {masterSets.length > 2 && (
                  <Link to="/masterset" className="text-white/70 hover:text-white text-xs text-center block">
                    +{masterSets.length - 2} more
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Binder Section - Compact */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <BookOpen size={16} className="text-white" />
                </div>
                <h3 className="text-lg font-bold">Digital Binders</h3>
              </div>
              <Link
                to="/binder-builder"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-1"
              >
                <Plus size={14} />
                Create
              </Link>
            </div>

            <div className="text-center py-4">
              <p className="text-white/80 text-sm mb-2">Create beautiful digital binders</p>
              <Link
                to="/binder-builder"
                className="text-white hover:text-yellow-300 text-sm font-semibold transition-colors duration-300"
              >
                Start building
              </Link>
            </div>
          </div>
        </div>

        {/* Official Sets Section - Enhanced */}
        <div className="mb-16 animate-fadeInUp">
          <div className="glass-dark rounded-3xl p-8 mb-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Official Sets</h2>
                <p className="text-slate-300">Track your progress across all Pokémon TCG sets</p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  to="/search"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2 neon-blue"
                >
                  <Plus size={18} />
                  Add Cards
                </Link>
                <button
                  onClick={() => setShowAllSets(!showAllSets)}
                  className="glass text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                >
                  {showAllSets ? "Show Less" : "View All"}
                  <ArrowRight size={18} className={`transition-transform ${showAllSets ? "rotate-90" : ""}`} />
                </button>
              </div>
            </div>

            <div
              className={`${showAllSets ? "max-h-96 overflow-y-auto custom-scrollbar" : "max-h-80 overflow-hidden"} transition-all duration-500`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {(showAllSets ? officialSets : officialSets.slice(0, 32)).map((set, index) => {
                  const { ownedCount, total, progress } = getSetProgress(set)

                  return (
                    <button
                      key={set.id}
                      onClick={() => handleSetClick(set)}
                      className="group glass text-left rounded-xl p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fadeInUp"
                      style={{ animationDelay: `${index * 0.02}s` }}
                    >
                      <div className="aspect-square flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <Calendar size={12} className="text-slate-300" />
                            {progress === 100 && (
                              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-1 rounded-full shadow-lg">
                                <Trophy size={10} className="text-white" />
                              </div>
                            )}
                          </div>

                          <h3 className="text-xs font-bold mb-2 line-clamp-2 text-white leading-tight group-hover:text-blue-300 transition-colors">
                            {set.name}
                          </h3>

                          <p className="text-xs text-slate-400 font-medium mb-3">{set.publishedOn.getFullYear()}</p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white">{progress}%</span>
                            <span className="text-xs font-bold text-white">
                              {ownedCount}/{total}
                            </span>
                          </div>
                          <div className="w-full bg-slate-600 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full rounded-full transition-all duration-1000"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {!showAllSets && officialSets.length > 32 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowAllSets(true)}
                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2 mx-auto"
                >
                  View {officialSets.length - 32} more sets
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Your Cards Section with Search and Filter */}
        <div className="animate-fadeInUp">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Your Cards</h2>
              <p className="text-slate-600">All the cards in your collection</p>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 w-64"
                />
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl hover:bg-white transition-all duration-300"
                >
                  <Filter size={18} className="text-slate-600" />
                  <span className="text-slate-700 font-medium">
                    {filterOptions.find((opt) => opt.value === filterBy)?.label}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-600 transition-transform ${showFilterDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterBy(option.value)
                          setShowFilterDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors duration-200 ${
                          filterBy === option.value ? "bg-blue-50 text-blue-600 font-semibold" : "text-slate-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View All Button */}
              <button
                onClick={() => setShowAllCards(!showAllCards)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 neon-blue"
              >
                <Eye size={18} />
                {showAllCards ? "Show Less" : "View All"}
              </button>
            </div>
          </div>

          {filteredCards.length === 0 ? (
            <div className="text-center py-16 card-container rounded-3xl">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
                <Grid size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {searchQuery || filterBy !== "all" ? "No Cards Found" : "No Cards Yet"}
              </h3>
              <p className="text-slate-600 mb-6">
                {searchQuery || filterBy !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Start building your collection by searching for cards"}
              </p>
              {!searchQuery && filterBy === "all" && (
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 neon-blue"
                >
                  <Plus size={18} />
                  Add Cards
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {(showAllCards ? filteredCards : filteredCards.slice(0, 32)).map((card, idx) => (
                <div
                  key={idx}
                  className="group card-container rounded-xl overflow-hidden hover-lift animate-fadeInUp"
                  style={{ animationDelay: `${(idx % 32) * 0.03}s` }}
                >
                  {/* Card Image */}
                  <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                    <img
                      src={card.image || "/placeholder.png"}
                      alt={card.name || "No Name"}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Card Info */}
                  <div className="p-3 space-y-2">
                    <div className="text-center">
                      <a
                        href={card.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 leading-tight"
                      >
                        {(card.name || "[No Name]")
                          .replace(/\b\d{1,3}(?:\/\d{1,3})?\b/g, "")
                          .replace(/\b[A-Z]{2,5}\d{2,4}\b/g, "")
                          .trim()}
                      </a>

                      <div className="mt-1 space-y-1">
                        <p className="text-xs text-slate-500 font-medium">{card.set || "Unknown Set"}</p>
                      </div>
                    </div>

                    {/* Variant Buttons */}
                    <div className="flex justify-center gap-1 flex-wrap">
                      {(card.subTypes || []).map(({ name: subType }) => {
                        const key = `${card.productId}-${subType}`
                        const isOwned = userCollection[key]

                        return (
                          <button
                            key={subType}
                            className={`group/btn relative w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300 border ${
                              isOwned
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400 text-white shadow-lg neon-cyan"
                                : `${getSubtypeColorClass(subType)} border`
                            } hover:scale-110 hover:shadow-lg`}
                            title={subType}
                            onClick={() => handleToggle(card, subType)}
                          >
                            {isOwned ? (
                              <Trash2 size={10} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                            ) : (
                              <Plus size={10} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showAllCards && filteredCards.length > 32 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllCards(true)}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 mx-auto"
              >
                View {filteredCards.length - 32} more cards
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Collection
