"use client"

import { useState, useEffect } from "react"
import Papa from "papaparse"
import { useLocation } from "react-router-dom"
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const BinderBuilder = () => {
  const location = useLocation()
  const [userId, setUserId] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [binderPages, setBinderPages] = useState([
    { left: Array(9).fill(null), right: Array(9).fill(null) }
  ])
  const [currentPage, setCurrentPage] = useState(0)
  const [binderSettings, setBinderSettings] = useState({
    name: "My Binder",
    rows: 3,
    cols: 3,
    backgroundColor: "#1a1a1a",
  })
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [filterBy, setFilterBy] = useState("all")
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchBinderFromQuery = async () => {
      if (!userId) return;
      const params = new URLSearchParams(location.search);
      const binderName = params.get("name");
      if (!binderName) return;

      const docId = binderName.toLowerCase().replace(/\s+/g, "-");
      const binderRef = doc(db, "users", userId, "binders", docId);
      const binderSnap = await getDoc(binderRef);
      if (binderSnap.exists()) {
        const data = binderSnap.data();
        setBinderPages(data.pages || []);
        setBinderSettings(data.settings || {});
      }
    };

    fetchBinderFromQuery();
  }, [userId, location.search]);

  const searchCards = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Fetch cards from local cards.json
      const response = await fetch("/data/cards.json")
      const allCards = await response.json()

      const filteredCards = allCards.filter(
        (card) =>
          (card.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
          card.set?.toLowerCase()?.includes(searchQuery.toLowerCase()))
      )

      setSearchResults(filteredCards.slice(0, 30)) // Limit to first 30 for performance
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

  const addCardToBinder = (card, pageIndex, side, slotIndex) => {
    const newPages = [...binderPages]
    newPages[pageIndex][side][slotIndex] = card
    setBinderPages(newPages)
  }

  const removeCardFromBinder = (pageIndex, side, slotIndex) => {
    const newPages = [...binderPages]
    newPages[pageIndex][side][slotIndex] = null
    setBinderPages(newPages)
  }

  const addNewPage = () => {
    const newPage = {
      left: Array(binderSettings.rows * binderSettings.cols).fill(null),
      right: Array(binderSettings.rows * binderSettings.cols).fill(null),
    }
    setBinderPages([...binderPages, newPage])
  }

  const clearBinder = () => {
    if (window.confirm("Are you sure you want to clear the entire binder?")) {
      setBinderPages([
        {
          left: Array(binderSettings.rows * binderSettings.cols).fill(null),
          right: Array(binderSettings.rows * binderSettings.cols).fill(null)
        }
      ])
      setCurrentPage(0)
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
        pages: binderPages,
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
    const newPages = binderPages.map((page) => {
      const newLeft = Array(newSize).fill(null)
      const newRight = Array(newSize).fill(null)
      // Copy existing cards to new left and right
      for (let i = 0; i < Math.min(page.left.length, newSize); i++) {
        newLeft[i] = page.left[i]
      }
      for (let i = 0; i < Math.min(page.right.length, newSize); i++) {
        newRight[i] = page.right[i]
      }
      return { left: newLeft, right: newRight }
    })
    setBinderPages(newPages)
    setBinderSettings((prev) => ({ ...prev, rows, cols }))
  }

  const filterOptions = [
    { value: "all", label: "All Cards" },
    { value: "rare", label: "Rare Cards" },
    { value: "common", label: "Common Cards" },
    { value: "set", label: "By Set" },
  ]

  const currentLeftPage = binderPages[currentPage]?.left || []
  const currentRightPage = binderPages[currentPage]?.right || []

  return (
    <div className="min-h-screen section-gradient-2 relative overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fadeInUp">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Binder Builder</h1>
              <p className="text-slate-600">Create and customize your digital binder</p>
            </div>
            {/* Move Settings, Preview, Save Binder buttons here */}
            <div className="flex items-center gap-3 ml-6">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 glass hover:bg-white/60 rounded-xl transition-all duration-300"
              >
                <Settings size={18} />
                Settings
              </button>
              <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="flex items-center gap-2 px-4 py-2 glass hover:bg-white/60 rounded-xl transition-all duration-300"
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
        </div>

        <div className="flex transition-all duration-300" style={{ marginRight: !isPreviewMode ? '400px' : '0' }}>
          {/* Enhanced Search Panel in slide-out drawer */}
          {!isPreviewMode && (
            <div
              className={`absolute right-0 top-0 bottom-0 w-[600px] bg-white shadow-xl z-40 transform-gpu transition-transform duration-300 ${
                isPreviewMode ? "translate-x-full pointer-events-none" : "translate-x-0 pointer-events-auto"
              }`}
            >
              <div className="card-container rounded-3xl p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg neon-blue">
                    <Search size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Search Cards</h3>
                </div>

                {/* Search Input */}
                <div className="relative mb-6">
                  <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search for cards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-lg"
                  />
                </div>

                {/* Filter Dropdown */}
                <div className="relative mb-6">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="w-full flex items-center justify-between px-4 py-4 border-2 border-slate-200 rounded-2xl hover:bg-slate-50 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <Filter size={18} className="text-slate-600" />
                      <span className="text-slate-700 font-medium">
                        {filterOptions.find((opt) => opt.value === filterBy)?.label}
                      </span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-slate-600 transition-transform ${showFilterDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                      {filterOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFilterBy(option.value)
                            setShowFilterDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors duration-200 ${
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
                <div className="grid grid-cols-3 gap-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                  {isSearching ? (
                    <div className="col-span-2 text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-slate-600 mt-4 font-medium">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((card) => (
                      <div
                        key={`${card.productId || card.id || card.name}-${card.set}-${card.subTypeName || ''}`}
                        className={`relative group aspect-[3/4] rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer
                          ${selectedCard === card ? "ring-4 ring-green-500" : ""}
                        `}
                        onClick={() => setSelectedCard(selectedCard === card ? null : card)}
                      >
                        <img
                          src={card.imageUrl || card.image || "/placeholder.svg"}
                          alt={card.name}
                          className="w-full h-full object-cover bg-white rounded-xl"
                        />
                        <div className="absolute inset-0">
                          <div className="flex items-center justify-center w-full h-full bg-black/10 group-hover:bg-black/30 transition">
                            <Plus size={28} className="text-white opacity-80 group-hover:opacity-100" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : searchQuery ? (
                    <div className="col-span-2 text-center py-12">
                      <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={24} className="text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-medium">No cards found</p>
                    </div>
                  ) : (
                    <div className="col-span-2 text-center py-12">
                      <Search size={48} className="text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 font-medium">Search for cards to add</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Binder Display */}
          <div className={`flex-1 animate-fadeInUp overflow-y-auto`}>
            {/* Enhanced Settings Panel */}
            {showSettings && !isPreviewMode && (
              <div className="card-container rounded-3xl p-8 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg neon-purple">
                    <Settings size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Binder Settings</h3>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Binder Name</label>
                    <input
                      type="text"
                      value={binderSettings.name}
                      onChange={(e) => setBinderSettings((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Rows (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={binderSettings.rows}
                      onChange={(e) => {
                        const rows = Math.max(1, Math.min(10, Number.parseInt(e.target.value) || 1))
                        updateBinderSize(rows, binderSettings.cols)
                      }}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Columns (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={binderSettings.cols}
                      onChange={(e) => {
                        const cols = Math.max(1, Math.min(10, Number.parseInt(e.target.value) || 1))
                        updateBinderSize(binderSettings.rows, cols)
                      }}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Background</label>
                    <input
                      type="color"
                      value={binderSettings.backgroundColor}
                      onChange={(e) => setBinderSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-full h-12 border-2 border-slate-200 rounded-xl cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-6">
                  <button
                    onClick={addNewPage}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 neon-cyan"
                  >
                    <Plus size={16} />
                    Add Page
                  </button>
                  <button
                    onClick={clearBinder}
                    className="flex items-center gap-2 px-6 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200 font-semibold"
                  >
                    <Trash2 size={16} />
                    Clear Binder
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced Binder */}
            <div className="card-container rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg neon-blue">
                    <BookOpen size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{binderSettings.name}</h2>
                    <p className="text-slate-600">
                      Page {currentPage + 1}-{Math.min(currentPage + 2, binderPages.length)} of {binderPages.length}
                    </p>
                  </div>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 2))}
                    disabled={currentPage === 0}
                    className="p-3 glass rounded-xl hover:bg-white/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm font-medium text-slate-600 px-4">
                    {Math.floor(currentPage / 2) + 1} / {Math.ceil(binderPages.length / 2)}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(binderPages.length - 2, currentPage + 2))}
                    disabled={currentPage >= binderPages.length - 2}
                    className="p-3 glass rounded-xl hover:bg-white/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <button
                    onClick={addNewPage}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 neon-cyan"
                  >
                    <Plus size={16} />
                    Add Page
                  </button>
                </div>
              </div>


              {/* Unified Binder Layout with Click-to-Place */}
              <div
                className="binder-container rounded-2xl p-8 relative"
                style={{
                  background: `linear-gradient(135deg, ${binderSettings.backgroundColor} 0%, ${binderSettings.backgroundColor}dd 100%)`,
                }}
              >
                <div className="flex gap-4 items-center">
                  {/* Left Page */}
                  <div className="flex-1">
                    <div
                      className="grid gap-3 relative z-10"
                      style={{
                        gridTemplateColumns: `repeat(${binderSettings.cols}, 1fr)`,
                        gridTemplateRows: `repeat(${binderSettings.rows}, 1fr)`,
                      }}
                    >
                      {currentLeftPage.map((card, index) => {
                        const isEmpty = !card
                        const isHighlight = selectedCard && isEmpty && !isPreviewMode
                        return (
                          <div
                            key={index}
                            className={`aspect-[3/4] rounded-lg border-2 border-dashed border-white/30 flex items-center justify-center transition-all duration-300 ${
                              card
                                ? "bg-transparent border-solid border-white/50"
                                : "card-slot hover:border-white/50"
                            } ${selectedCard && isEmpty && !isPreviewMode ? "border-4 border-green-500 cursor-pointer" : ""} ${
                              selectedSlot?.pageIndex === currentPage && selectedSlot?.side === 'left' && selectedSlot?.slotIndex === index ? "ring-4 ring-blue-500" : ""
                            }`}
                            onClick={() => {
                              if (selectedCard && isEmpty && !isPreviewMode) {
                                addCardToBinder(selectedCard, currentPage, 'left', index)
                                setSelectedCard(null)
                              } else if (!selectedCard && !isPreviewMode) {
                                if (selectedSlot) {
                                  const newPages = [...binderPages]
                                  const { pageIndex, side, slotIndex } = selectedSlot
                                  const temp = newPages[currentPage]['left'][index]
                                  newPages[currentPage]['left'][index] = newPages[pageIndex][side][slotIndex]
                                  newPages[pageIndex][side][slotIndex] = temp
                                  setBinderPages(newPages)
                                  setSelectedSlot(null)
                                } else if (card) {
                                  setSelectedSlot({ pageIndex: currentPage, side: 'left', slotIndex: index })
                                }
                              }
                            }}
                          >
                            {card ? (
                              <div className="w-full h-full user-select-none">
                                <div
                                  className="relative w-full h-full group user-select-none"
                                >
                                  <img
                                    src={card.imageUrl || card.image || "/placeholder.svg"}
                                    alt={card.name}
                                    className="w-full h-full object-cover rounded-lg shadow-lg"
                                  />
                                  {!isPreviewMode && (
                                    <button
                                      onClick={() => removeCardFromBinder(currentPage, 'left', index)}
                                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 shadow-lg"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : !isPreviewMode ? (
                              <div className="text-center text-white/70">{isHighlight ? "Click to Place" : "Empty Slot"}</div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Slim Divider */}
                  <div
                    className="binder-divider w-1 rounded-full"
                    style={{ height: `${binderSettings.rows * 120}px` }}
                  ></div>

                  {/* Right Page */}
                  <div className="flex-1">
                    <div
                      className="grid gap-3 relative z-10"
                      style={{
                        gridTemplateColumns: `repeat(${binderSettings.cols}, 1fr)`,
                        gridTemplateRows: `repeat(${binderSettings.rows}, 1fr)`,
                      }}
                    >
                      {currentRightPage.map((card, index) => {
                        const isEmpty = !card
                        const isHighlight = selectedCard && isEmpty && !isPreviewMode
                        return (
                          <div
                            key={index}
                            className={`aspect-[3/4] rounded-lg border-2 border-dashed border-white/30 flex items-center justify-center transition-all duration-300 ${
                              card
                                ? "bg-transparent border-solid border-white/50"
                                : "card-slot hover:border-white/50"
                            } ${selectedCard && isEmpty && !isPreviewMode ? "border-4 border-green-500 cursor-pointer" : ""} ${
                              selectedSlot?.pageIndex === currentPage && selectedSlot?.side === 'right' && selectedSlot?.slotIndex === index ? "ring-4 ring-blue-500" : ""
                            }`}
                            onClick={() => {
                              if (selectedCard && isEmpty && !isPreviewMode) {
                                addCardToBinder(selectedCard, currentPage, 'right', index)
                                setSelectedCard(null)
                              } else if (!selectedCard && !isPreviewMode) {
                                if (selectedSlot) {
                                  const newPages = [...binderPages]
                                  const { pageIndex, side, slotIndex } = selectedSlot
                                  const temp = newPages[currentPage]['right'][index]
                                  newPages[currentPage]['right'][index] = newPages[pageIndex][side][slotIndex]
                                  newPages[pageIndex][side][slotIndex] = temp
                                  setBinderPages(newPages)
                                  setSelectedSlot(null)
                                } else if (card) {
                                  setSelectedSlot({ pageIndex: currentPage, side: 'right', slotIndex: index })
                                }
                              }
                            }}
                          >
                            {card ? (
                              <div className="w-full h-full user-select-none">
                                <div
                                  className="relative w-full h-full group user-select-none"
                                >
                                  <img
                                    src={card.imageUrl || card.image || "/placeholder.svg"}
                                    alt={card.name}
                                    className="w-full h-full object-cover rounded-lg shadow-lg"
                                  />
                                  {!isPreviewMode && (
                                    <button
                                      onClick={() => removeCardFromBinder(currentPage, 'right', index)}
                                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 shadow-lg"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : !isPreviewMode ? (
                              <div className="text-center text-white/70">{isHighlight ? "Click to Place" : "Empty Slot"}</div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
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
