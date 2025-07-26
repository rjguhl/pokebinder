"use client"

import { useEffect, useState } from "react"
import Papa from "papaparse"
import allCards from "../../data/cards.json"
import { db, auth } from "../firebase"
import { collection, getDocs, doc, setDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
  Search,
  CheckCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Zap,
  Filter,
  Grid,
  User,
  Target,
  Settings,
} from "lucide-react"

const MasterSet = () => {
  const [pokemonList, setPokemonList] = useState([])
  const [setsList, setSetsList] = useState([])
  const [query, setQuery] = useState("")
  const [filteredList, setFilteredList] = useState([])
  const [selectedOption, setSelectedOption] = useState(null)
  const [masterSetType, setMasterSetType] = useState("pokemon") // "pokemon" or "set"
  const [includeVariants, setIncludeVariants] = useState(false)
  const [artworkOnly, setArtworkOnly] = useState(true)
  const [rarityFilter, setRarityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("number")
  const [cards, setCards] = useState([])
  const [userCollection, setUserCollection] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [user, setUser] = useState(null)
  const [imageStatus, setImageStatus] = useState({})

  const handleAddToCollection = async (card) => {
    if (!user) return
    const cardId = card.id
    try {
      await setDoc(doc(db, "users", user.uid, "collection", cardId), {
        name: card.name,
        cardId,
        image: card.imageUrl || null,
        number: card.extNumber,
        set: card.set || "",
        rarity: card.rarity || "",
        finish: card.variantFinish || "normal",
        addedAt: new Date(),
      })
      setUserCollection((prev) => [...prev, cardId])
    } catch (err) {
      console.error("Error adding to collection:", err)
    }
  }

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  useEffect(() => {
    // Load Pokemon list
    fetch("/data/pokemon.csv")
      .then((response) => response.text())
      .then((csv) => {
        const { data } = Papa.parse(csv, { header: true })
        const names = data
          .map((row) => row.Name)
          .filter(Boolean)
          .sort()
        setPokemonList(names)
      })
      .catch((err) => console.error("Failed to load pokemon list:", err))

    // Load sets list from cards data
    const uniqueSets = [...new Set(allCards.map((card) => card.set || card.groupName).filter(Boolean))].sort()
    setSetsList(uniqueSets)
  }, [])

  useEffect(() => {
    const list = masterSetType === "pokemon" ? pokemonList : setsList
    if (!query.trim()) return setFilteredList([])
    setFilteredList(list.filter((item) => item.toLowerCase().includes(query.toLowerCase())).slice(0, 10))
  }, [query, pokemonList, setsList, masterSetType])

  const fetchUserCollection = async (uid) => {
    const snapshot = await getDocs(collection(db, "users", uid, "collection"))
    setUserCollection(snapshot.docs.map((doc) => doc.id))
  }

  const handleBuild = async () => {
    if (!selectedOption || !user) return
    setLoading(true)
    setCards([])
    await fetchUserCollection(user.uid)

    try {
      let filteredCards = []

      if (masterSetType === "pokemon") {
        // Filter by Pokemon name
        filteredCards = allCards.filter((c) => {
          const cardName = c.name?.toLowerCase() || ""
          const pokemonName = selectedOption.toLowerCase()
          return cardName.includes(pokemonName)
        })
      } else {
        // Filter by set
        filteredCards = allCards.filter((c) => {
          const cardSet = (c.set || c.groupName || "").toLowerCase()
          const selectedSet = selectedOption.toLowerCase()
          return cardSet === selectedSet
        })
      }

      // Apply rarity filter
      if (rarityFilter !== "all") {
        filteredCards = filteredCards.filter((c) => {
          const rarity = (c.rarity || "").toLowerCase()
          return rarity.includes(rarityFilter.toLowerCase())
        })
      }

      const grouped = {}

      filteredCards.forEach((card) => {
        const key = artworkOnly ? `${card.name}-${card.extNumber}` : card.productId
        const finish = card.subTypeName || "Normal"

        if (!grouped[key]) {
          grouped[key] = {
            ...card,
            id: key,
            finishes: new Set(),
            number: card.extNumber,
            variants: [],
          }
        }
        grouped[key].finishes.add(finish)
        grouped[key].variants.push({
          ...card,
          finish,
          id: `${card.productId}-${finish}`,
        })
      })

      let variants = []

      if (includeVariants) {
        variants = Object.values(grouped).flatMap((card) => {
          return Array.from(card.finishes).map((finish) => ({
            ...card,
            id: `${card.productId}-${finish}`,
            variantFinish: finish,
          }))
        })
      } else {
        variants = Object.values(grouped).map((card) => ({
          ...card,
          variantFinish: null,
          finishes: Array.from(card.finishes),
        }))
      }

      // Sort cards
      variants.sort((a, b) => {
        if (sortBy === "number") {
          const numA = Number.parseInt(a.extNumber?.replace(/[^\d]/g, "")) || 0
          const numB = Number.parseInt(b.extNumber?.replace(/[^\d]/g, "")) || 0
          return numA - numB
        } else if (sortBy === "name") {
          return (a.name || "").localeCompare(b.name || "")
        } else if (sortBy === "rarity") {
          return (a.rarity || "").localeCompare(b.rarity || "")
        }
        return 0
      })

      setCards(variants)
      setCurrentPage(0)
    } catch (err) {
      console.error("Error building cards:", err)
    }

    setLoading(false)
  }

  const cardsPerPage = 18
  const paginatedCards = cards.slice(currentPage * cardsPerPage, (currentPage + 1) * cardsPerPage)
  const totalPages = Math.ceil(cards.length / cardsPerPage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full text-sm font-medium text-purple-700 mb-4">
            <Zap size={16} className="animate-pulse" />
            Build Your Perfect Set
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Master{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Sets</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create comprehensive collections for any Pokémon or set with complete variant tracking
          </p>
        </div>

        {/* Build Form */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-fadeInUp">
            {/* Master Set Type Selection */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Target size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Choose Master Set Type</h2>
                  <p className="text-gray-600">Select what type of collection you want to build</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => {
                    setMasterSetType("pokemon")
                    setQuery("")
                    setSelectedOption(null)
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                    masterSetType === "pokemon"
                      ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <User size={24} className={masterSetType === "pokemon" ? "text-purple-600" : "text-gray-400"} />
                    <span className="font-bold text-gray-900">Pokémon Collection</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Build a master set for a specific Pokémon, including all cards featuring that Pokémon across
                    different sets
                  </p>
                </button>

                <button
                  onClick={() => {
                    setMasterSetType("set")
                    setQuery("")
                    setSelectedOption(null)
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                    masterSetType === "set"
                      ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Grid size={24} className={masterSetType === "set" ? "text-purple-600" : "text-gray-400"} />
                    <span className="font-bold text-gray-900">Set Collection</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Build a complete master set for an entire TCG set, tracking every card and variant in that set
                  </p>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
              <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={masterSetType === "pokemon" ? "Search for a Pokémon..." : "Search for a set..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300"
              />

              {/* Dropdown */}
              {filteredList.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl z-10 max-h-60 overflow-auto">
                  {filteredList.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setQuery(item)
                        setFilteredList([])
                        setSelectedOption(item)
                      }}
                      className="w-full text-left px-6 py-3 hover:bg-purple-50 transition-colors capitalize text-gray-700 font-medium first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Advanced Options */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Collection Options */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Settings size={20} className="text-gray-600" />
                  <h3 className="text-lg font-bold text-gray-900">Collection Options</h3>
                </div>

                <div className="space-y-4">
                  {/* Artwork vs Variants */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Collection Style</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="artworkStyle"
                          checked={artworkOnly}
                          onChange={() => setArtworkOnly(true)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700">One per artwork (recommended)</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="artworkStyle"
                          checked={!artworkOnly}
                          onChange={() => setArtworkOnly(false)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700">All unique cards</span>
                      </label>
                    </div>
                  </div>

                  {/* Include Variants */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeVariants}
                        onChange={(e) => setIncludeVariants(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Include all variants</span>
                        <p className="text-xs text-gray-500">Show separate entries for Holo, Reverse Holo, etc.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Filter size={20} className="text-gray-600" />
                  <h3 className="text-lg font-bold text-gray-900">Filters & Sorting</h3>
                </div>

                <div className="space-y-4">
                  {/* Rarity Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Rarity Filter</label>
                    <select
                      value={rarityFilter}
                      onChange={(e) => setRarityFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    >
                      <option value="all">All Rarities</option>
                      <option value="common">Common</option>
                      <option value="uncommon">Uncommon</option>
                      <option value="rare">Rare</option>
                      <option value="holo">Holo Rare</option>
                      <option value="ultra">Ultra Rare</option>
                      <option value="secret">Secret Rare</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    >
                      <option value="number">Card Number</option>
                      <option value="name">Name</option>
                      <option value="rarity">Rarity</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Build Button */}
            <div className="text-center">
              <button
                onClick={handleBuild}
                disabled={!selectedOption || loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Building Master Set...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap size={20} />
                    Build Master Set
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Cards Display */}
        {cards.length > 0 && !loading && (
          <div className="animate-fadeInUp">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedOption} Master Set
                <span className="text-lg font-normal text-gray-600 ml-2">
                  ({masterSetType === "pokemon" ? "Pokémon" : "Set"} Collection)
                </span>
              </h3>
              <p className="text-gray-600">
                {cards.length} cards • Page {currentPage + 1} of {totalPages}
              </p>
            </div>

            {/* Binder Layout */}
            <div className="flex flex-col items-center gap-8">
              <div className="flex flex-col lg:flex-row justify-center gap-8 w-full max-w-6xl">
                {[0, 9].map((offset) => (
                  <div key={offset} className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-3xl shadow-2xl">
                    <div className="grid grid-cols-3 gap-4">
                      {Array.from({ length: 9 }, (_, i) => {
                        const card = paginatedCards[i + offset]
                        if (!card)
                          return <div key={i + offset} className="aspect-[5/7] bg-gray-800 rounded-xl opacity-20" />

                        const cardId = card.id
                        const cardKey = cardId || `placeholder-${i + offset}`
                        let owned = false

                        if (!includeVariants) {
                          const baseIdOnly =
                            typeof card.id === "string" ? card.id.split("-")[0] : card.productId?.toString()
                          owned = userCollection.some(
                            (id) => id.startsWith(baseIdOnly + "-") && id !== `${baseIdOnly}-false`,
                          )
                        } else {
                          owned = userCollection.includes(cardId)
                        }

                        const isLoaded = imageStatus[cardKey]

                        const labelMap = {
                          "Reverse Holofoil": "Reverse",
                          Holofoil: "Holo",
                          "1st Edition": "1st Ed",
                          Normal: "Normal",
                        }
                        const variantLabel = labelMap[card.variantFinish] || card.variantFinish

                        return (
                          <div
                            key={i + offset}
                            className={`group relative aspect-[5/7] bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
                              owned
                                ? "ring-4 ring-green-400 shadow-lg shadow-green-400/50"
                                : "opacity-60 hover:opacity-80"
                            }`}
                          >
                            <img
                              src={card.imageUrl || "/placeholder.svg"}
                              alt={card.name}
                              onLoad={() => setImageStatus((prev) => ({ ...prev, [cardKey]: true }))}
                              onError={(e) => {
                                if (!e.currentTarget.src.includes("placeholder.png")) {
                                  e.currentTarget.src = "/placeholder.png"
                                }
                              }}
                              className={`max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 ${isLoaded ? "" : "hidden"}`}
                            />

                            {!isLoaded && (
                              <div className="w-full h-full bg-gray-700 animate-pulse rounded-xl shimmer" />
                            )}

                            {/* Variant Indicators */}
                            {!includeVariants && card.finishes && card.finishes.size > 1 && (
                              <div className="absolute top-2 left-2 flex gap-1">
                                {Array.from(card.finishes)
                                  .slice(0, 3)
                                  .map((finish, idx) => (
                                    <div
                                      key={idx}
                                      className={`w-2 h-2 rounded-full ${
                                        finish === "Normal"
                                          ? "bg-gray-400"
                                          : finish === "Holofoil"
                                            ? "bg-yellow-400"
                                            : finish === "Reverse Holofoil"
                                              ? "bg-blue-400"
                                              : "bg-purple-400"
                                      }`}
                                      title={finish}
                                    />
                                  ))}
                                {card.finishes.size > 3 && (
                                  <div className="w-2 h-2 rounded-full bg-white text-xs flex items-center justify-center">
                                    +
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Variant Badge */}
                            {isLoaded && card.variantFinish && card.variantFinish !== "Normal" && (
                              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-1 rounded-lg shadow-lg font-bold">
                                {variantLabel}
                              </div>
                            )}

                            {/* Card Info */}
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2 text-white text-xs">
                                <div className="font-bold truncate">{card.name}</div>
                                <div className="text-gray-300">#{card.extNumber}</div>
                              </div>
                            </div>

                            {/* Action Button */}
                            {!owned ? (
                              <button
                                onClick={() => handleAddToCollection(card)}
                                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-full hover:shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                              >
                                <Plus size={16} />
                              </button>
                            ) : (
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100">
                                <CheckCircle size={16} />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-purple-300 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-xl font-medium transition-all duration-300 ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                            : "bg-white text-gray-700 hover:bg-purple-50 border-2 border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-purple-300 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MasterSet
