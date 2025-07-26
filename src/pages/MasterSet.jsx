"use client"

import { useEffect, useState } from "react"
import Papa from "papaparse"
import allCards from "../../data/cards.json"
import { db, auth } from "../firebase"
import { collection, getDocs, doc, setDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Search, CheckCircle, Plus, ChevronLeft, ChevronRight, Zap, Target, User, Grid, Loader2 } from "lucide-react"

const MasterSet = () => {
  const [pokemonList, setPokemonList] = useState([])
  const [setsList, setSetsList] = useState([])
  const [query, setQuery] = useState("")
  const [filteredList, setFilteredList] = useState([])
  const [selectedOption, setSelectedOption] = useState(null)
  const [masterSetType, setMasterSetType] = useState("pokemon") // "pokemon" or "set"
  const [collectionStyle, setCollectionStyle] = useState("artwork") // "artwork" or "subtype"
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
        number: card.number,
        set: card.set || "",
        rarity: card.rarity || "",
        finish: card.subTypeName || "Normal",
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

    // Load sets list from cards data - using groupId to get unique sets
    const uniqueSets = [
      ...new Set(
        allCards
          .map((card) => {
            // Try to extract set name from URL or use groupId
            const urlParts = card.url?.split("/") || []
            const setName = urlParts[urlParts.length - 2]?.replace(/-/g, " ") || `Set ${card.groupId}`
            return setName
          })
          .filter(Boolean),
      ),
    ].sort()
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

  const getCardNumber = (card) => {
    const numberData = card.extendedData?.find((data) => data.name === "Number")
    return numberData?.value || "0"
  }

  const getCardRarity = (card) => {
    const rarityData = card.extendedData?.find((data) => data.name === "Rarity")
    return rarityData?.value || "Unknown"
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
        // Filter by set - match against URL or groupId
        filteredCards = allCards.filter((c) => {
          const urlParts = c.url?.split("/") || []
          const setName = urlParts[urlParts.length - 2]?.replace(/-/g, " ") || `Set ${c.groupId}`
          const selectedSet = selectedOption.toLowerCase()
          return setName.toLowerCase() === selectedSet
        })
      }

      let processedCards = []

      if (collectionStyle === "artwork") {
        // One per artwork - group by name and card number
        const grouped = {}
        filteredCards.forEach((card) => {
          const key = `${card.name}-${getCardNumber(card)}`
          if (!grouped[key]) {
            grouped[key] = {
              ...card,
              id: key,
              number: getCardNumber(card),
              rarity: getCardRarity(card),
              subTypeName: "Artwork",
              variants: card.prices?.map((p) => p.subTypeName) || ["Normal"],
            }
          }
        })
        processedCards = Object.values(grouped)
      } else {
        // One per subtype - create separate entries for each price subtype
        filteredCards.forEach((card) => {
          if (card.prices && card.prices.length > 0) {
            card.prices.forEach((price) => {
              processedCards.push({
                ...card,
                id: `${card.productId}-${price.subTypeName}`,
                number: getCardNumber(card),
                rarity: getCardRarity(card),
                subTypeName: price.subTypeName,
                price: price.marketPrice || price.midPrice || 0,
              })
            })
          } else {
            processedCards.push({
              ...card,
              id: `${card.productId}-Normal`,
              number: getCardNumber(card),
              rarity: getCardRarity(card),
              subTypeName: "Normal",
              price: 0,
            })
          }
        })
      }

      // Sort cards
      processedCards.sort((a, b) => {
        if (sortBy === "number") {
          const numA = Number.parseInt(a.number?.replace(/[^\d]/g, "")) || 0
          const numB = Number.parseInt(b.number?.replace(/[^\d]/g, "")) || 0
          return numA - numB
        } else if (sortBy === "name") {
          return (a.name || "").localeCompare(b.name || "")
        } else if (sortBy === "rarity") {
          return (a.rarity || "").localeCompare(b.rarity || "")
        }
        return 0
      })

      setCards(processedCards)
      setCurrentPage(0)
    } catch (err) {
      console.error("Error building cards:", err)
    }

    setLoading(false)
  }

  const cardsPerPage = 18 // 9 per side
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

            {/* Collection Options */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Grid size={16} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Collection Style</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    collectionStyle === "artwork"
                      ? "border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  <input
                    type="radio"
                    name="collectionStyle"
                    value="artwork"
                    checked={collectionStyle === "artwork"}
                    onChange={(e) => setCollectionStyle(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        collectionStyle === "artwork" ? "border-blue-500 bg-blue-500" : "border-gray-300"
                      }`}
                    >
                      {collectionStyle === "artwork" && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">One per Artwork</span>
                      <p className="text-sm text-gray-600">Show one card per unique artwork</p>
                    </div>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    collectionStyle === "subtype"
                      ? "border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  <input
                    type="radio"
                    name="collectionStyle"
                    value="subtype"
                    checked={collectionStyle === "subtype"}
                    onChange={(e) => setCollectionStyle(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        collectionStyle === "subtype" ? "border-blue-500 bg-blue-500" : "border-gray-300"
                      }`}
                    >
                      {collectionStyle === "subtype" && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">One per Subtype</span>
                      <p className="text-sm text-gray-600">Show separate entries for Normal, Holo, etc.</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Sort Options */}
            <div className="mb-8">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300"
              >
                <option value="number">Card Number</option>
                <option value="name">Name</option>
                <option value="rarity">Rarity</option>
              </select>
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
                    <Loader2 size={20} className="animate-spin" />
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

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 animate-fadeInUp">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-4">
              <Loader2 size={32} className="text-white animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Building Your Master Set</h3>
            <p className="text-gray-600">Processing cards and organizing your collection...</p>
          </div>
        )}

        {/* Binder Display */}
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

            {/* Binder Container */}
            <div className="binder-container rounded-3xl p-8 shadow-2xl max-w-6xl mx-auto">
              <div className="flex justify-center gap-2">
                {/* Left Page */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl">
                  <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 9 }, (_, i) => {
                      const card = paginatedCards[i]
                      if (!card) {
                        return <div key={i} className="aspect-[5/7] bg-gray-700 rounded-xl opacity-30" />
                      }

                      const cardId = card.id
                      const owned = userCollection.includes(cardId)
                      const isLoaded = imageStatus[cardId]

                      return (
                        <div
                          key={i}
                          className={`group relative aspect-[5/7] bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
                            owned
                              ? "ring-4 ring-green-400 shadow-lg shadow-green-400/50"
                              : "opacity-70 hover:opacity-90"
                          }`}
                        >
                          <img
                            src={card.imageUrl || "/placeholder.svg?height=280&width=200&query=pokemon card"}
                            alt={card.name}
                            onLoad={() => setImageStatus((prev) => ({ ...prev, [cardId]: true }))}
                            onError={(e) => {
                              if (!e.currentTarget.src.includes("placeholder.svg")) {
                                e.currentTarget.src = "/placeholder.svg?height=280&width=200"
                              }
                            }}
                            className={`max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 ${isLoaded ? "" : "hidden"}`}
                          />

                          {!isLoaded && <div className="w-full h-full bg-gray-600 animate-pulse rounded-xl" />}

                          {/* Subtype Badge */}
                          {isLoaded &&
                            card.subTypeName &&
                            card.subTypeName !== "Normal" &&
                            card.subTypeName !== "Artwork" && (
                              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-1 rounded-lg shadow-lg font-bold">
                                {card.subTypeName}
                              </div>
                            )}

                          {/* Card Info */}
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2 text-white text-xs">
                              <div className="font-bold truncate">{card.name}</div>
                              <div className="text-gray-300">#{card.number}</div>
                              {card.rarity && <div className="text-gray-400 text-xs">{card.rarity}</div>}
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

                {/* Divider */}
                <div className="binder-divider w-1 rounded-full"></div>

                {/* Right Page */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl">
                  <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 9 }, (_, i) => {
                      const card = paginatedCards[i + 9]
                      if (!card) {
                        return <div key={i + 9} className="aspect-[5/7] bg-gray-700 rounded-xl opacity-30" />
                      }

                      const cardId = card.id
                      const owned = userCollection.includes(cardId)
                      const isLoaded = imageStatus[cardId]

                      return (
                        <div
                          key={i + 9}
                          className={`group relative aspect-[5/7] bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
                            owned
                              ? "ring-4 ring-green-400 shadow-lg shadow-green-400/50"
                              : "opacity-70 hover:opacity-90"
                          }`}
                        >
                          <img
                            src={card.imageUrl || "/placeholder.svg?height=280&width=200&query=pokemon card"}
                            alt={card.name}
                            onLoad={() => setImageStatus((prev) => ({ ...prev, [cardId]: true }))}
                            onError={(e) => {
                              if (!e.currentTarget.src.includes("placeholder.svg")) {
                                e.currentTarget.src = "/placeholder.svg?height=280&width=200"
                              }
                            }}
                            className={`max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 ${isLoaded ? "" : "hidden"}`}
                          />

                          {!isLoaded && <div className="w-full h-full bg-gray-600 animate-pulse rounded-xl" />}

                          {/* Subtype Badge */}
                          {isLoaded &&
                            card.subTypeName &&
                            card.subTypeName !== "Normal" &&
                            card.subTypeName !== "Artwork" && (
                              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-1 rounded-lg shadow-lg font-bold">
                                {card.subTypeName}
                              </div>
                            )}

                          {/* Card Info */}
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2 text-white text-xs">
                              <div className="font-bold truncate">{card.name}</div>
                              <div className="text-gray-300">#{card.number}</div>
                              {card.rarity && <div className="text-gray-400 text-xs">{card.rarity}</div>}
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
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-medium text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
                            : "bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20"
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
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-medium text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
