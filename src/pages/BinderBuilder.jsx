"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import {
  Search,
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Settings,
  BookOpen,
  ArrowLeft,
  Filter,
  ChevronDown,
} from "lucide-react"

const BinderBuilder = () => {
  const [userId, setUserId] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [binderCards, setBinderCards] = useState(Array(18).fill(null)) // 3x6 grid
  const [binderSettings, setBinderSettings] = useState({
    name: "My Binder",
    rows: 3,
    cols: 6,
    backgroundColor: "#667eea",
  })
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [filterBy, setFilterBy] = useState("all")
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  const searchCards = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Mock search results - replace with actual API call
      const mockResults = [
        {
          id: 1,
          name: "Charizard",
          set: "Base Set",
          image: "/placeholder.svg?height=280&width=200&text=Charizard",
          rarity: "Rare Holo",
        },
        {
          id: 2,
          name: "Pikachu",
          set: "Base Set",
          image: "/placeholder.svg?height=280&width=200&text=Pikachu",
          rarity: "Common",
        },
        {
          id: 3,
          name: "Blastoise",
          set: "Base Set",
          image: "/placeholder.svg?height=280&width=200&text=Blastoise",
          rarity: "Rare Holo",
        },
        {
          id: 4,
          name: "Venusaur",
          set: "Base Set",
          image: "/placeholder.svg?height=280&width=200&text=Venusaur",
          rarity: "Rare Holo",
        },
      ].filter(
        (card) =>
          card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.set.toLowerCase().includes(searchQuery.toLowerCase()),
      )

      setSearchResults(mockResults)
    } catch (error) {
      console.error("Error searching cards:", error)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchCards()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const addCardToBinder = (card, slotIndex) => {
    const newBinderCards = [...binderCards]
    newBinderCards[slotIndex] = card
    setBinderCards(newBinderCards)
  }

  const removeCardFromBinder = (slotIndex) => {
    const newBinderCards = [...binderCards]
    newBinderCards[slotIndex] = null
    setBinderCards(newBinderCards)
  }

  const clearBinder = () => {
    if (window.confirm("Are you sure you want to clear the entire binder?")) {
      setBinderCards(Array(binderSettings.rows * binderSettings.cols).fill(null))
    }
  }

  const saveBinder = async () => {
    if (!userId) {
      alert("Please sign in to save your binder")
      return
    }

    try {
      const binderData = {
        name: binderSettings.name,
        cards: binderCards,
        settings: binderSettings,
        createdAt: new Date(),
        userId,
      }

      const docId = binderSettings.name.toLowerCase().replace(/\s+/g, "-")
      await setDoc(doc(db, "users", userId, "binders", docId), binderData)
      alert("Binder saved successfully!")
    } catch (error) {
      console.error("Error saving binder:", error)
      alert("Failed to save binder")
    }
  }

  const updateBinderSize = (rows, cols) => {
    const newSize = rows * cols
    const newCards = Array(newSize).fill(null)

    // Copy existing cards to new array
    for (let i = 0; i < Math.min(binderCards.length, newSize); i++) {
      newCards[i] = binderCards[i]
    }

    setBinderCards(newCards)
    setBinderSettings((prev) => ({ ...prev, rows, cols }))
  }

  const filterOptions = [
    { value: "all", label: "All Cards" },
    { value: "rare", label: "Rare Cards" },
    { value: "common", label: "Common Cards" },
    { value: "set", label: "By Set" },
  ]

  return (
    <div className="min-h-screen section-gradient-2">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fadeInUp">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Binder Builder</h1>
              <p className="text-slate-600">Create and customize your digital binder</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl hover:bg-white transition-all duration-300"
            >
              <Settings size={18} />
              Settings
            </button>
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl hover:bg-white transition-all duration-300"
            >
              {isPreviewMode ? <EyeOff size={18} /> : <Eye size={18} />}
              {isPreviewMode ? "Edit" : "Preview"}
            </button>
            <button
              onClick={saveBinder}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 neon-blue"
            >
              <Save size={18} />
              Save Binder
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Search Panel */}
          {!isPreviewMode && (
            <div className="lg:col-span-1 animate-slideInRight">
              <div className="card-container rounded-2xl p-6 sticky top-24">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Search size={20} />
                  Search Cards
                </h3>

                {/* Search Input */}
                <div className="relative mb-4">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search for cards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                {/* Filter Dropdown */}
                <div className="relative mb-4">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2">
                      <Filter size={18} className="text-slate-600" />
                      <span className="text-slate-700">
                        {filterOptions.find((opt) => opt.value === filterBy)?.label}
                      </span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-slate-600 transition-transform ${showFilterDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
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

                {/* Search Results */}
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {isSearching ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-slate-600 mt-2">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((card) => (
                      <div
                        key={card.id}
                        className="group bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
                        onClick={() => {
                          const emptySlot = binderCards.findIndex((slot) => slot === null)
                          if (emptySlot !== -1) {
                            addCardToBinder(card, emptySlot)
                          } else {
                            alert("Binder is full! Remove a card first.")
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={card.image || "/placeholder.svg"}
                            alt={card.name}
                            className="w-12 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 text-sm">{card.name}</h4>
                            <p className="text-xs text-slate-600">{card.set}</p>
                            <p className="text-xs text-slate-500">{card.rarity}</p>
                          </div>
                          <Plus size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    ))
                  ) : searchQuery ? (
                    <div className="text-center py-8">
                      <p className="text-slate-600">No cards found</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Search size={32} className="text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600">Search for cards to add</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Binder Display */}
          <div className={`${isPreviewMode ? "lg:col-span-4" : "lg:col-span-3"} animate-fadeInUp`}>
            {/* Settings Panel */}
            {showSettings && !isPreviewMode && (
              <div className="card-container rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Binder Settings</h3>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Binder Name</label>
                    <input
                      type="text"
                      value={binderSettings.name}
                      onChange={(e) => setBinderSettings((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Size</label>
                    <select
                      value={`${binderSettings.rows}x${binderSettings.cols}`}
                      onChange={(e) => {
                        const [rows, cols] = e.target.value.split("x").map(Number)
                        updateBinderSize(rows, cols)
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="3x6">3x6 (18 cards)</option>
                      <option value="4x6">4x6 (24 cards)</option>
                      <option value="3x9">3x9 (27 cards)</option>
                      <option value="4x9">4x9 (36 cards)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Background</label>
                    <input
                      type="color"
                      value={binderSettings.backgroundColor}
                      onChange={(e) => setBinderSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-full h-10 border border-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={clearBinder}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <Trash2 size={16} />
                    Clear Binder
                  </button>
                </div>
              </div>
            )}

            {/* Binder */}
            <div className="card-container rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <BookOpen size={20} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{binderSettings.name}</h2>
                </div>
                <div className="text-sm text-slate-600">
                  {binderCards.filter((card) => card !== null).length} / {binderCards.length} cards
                </div>
              </div>

              {/* Binder Page */}
              <div
                className="binder-page rounded-2xl p-6 relative"
                style={{
                  background: `linear-gradient(135deg, ${binderSettings.backgroundColor} 0%, ${binderSettings.backgroundColor}dd 100%)`,
                }}
              >
                {/* Binder Rings */}
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-8">
                  {[...Array(binderSettings.rows)].map((_, i) => (
                    <div key={i} className="w-6 h-6 binder-ring rounded-full"></div>
                  ))}
                </div>

                {/* Card Grid */}
                <div
                  className="ml-8 grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${binderSettings.cols}, 1fr)`,
                    gridTemplateRows: `repeat(${binderSettings.rows}, 1fr)`,
                  }}
                >
                  {binderCards.map((card, index) => (
                    <div
                      key={index}
                      className={`aspect-[3/4] rounded-lg border-2 border-dashed border-white/30 flex items-center justify-center transition-all duration-300 ${
                        card ? "bg-transparent border-solid border-white/50" : "card-slot hover:border-white/50"
                      }`}
                    >
                      {card ? (
                        <div className="relative w-full h-full group">
                          <img
                            src={card.image || "/placeholder.svg"}
                            alt={card.name}
                            className="w-full h-full object-cover rounded-lg shadow-lg"
                          />
                          {!isPreviewMode && (
                            <button
                              onClick={() => removeCardFromBinder(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ) : !isPreviewMode ? (
                        <div className="text-center">
                          <Plus size={24} className="text-white/50 mx-auto mb-2" />
                          <p className="text-xs text-white/70">Add Card</p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BinderBuilder
