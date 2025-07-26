"use client"

import groupDataUrl from "../../PokemonGroups.csv?url"
import Papa from "papaparse"
import { useState, useEffect } from "react"
import { db, auth } from "../firebase"
import { collection, setDoc, doc, getDocs, deleteDoc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
  Trash2,
  CheckCircle,
  Plus,
  SearchIcon,
  Grid,
  List,
  Sparkles,
  Filter,
  ChevronDown,
  X,
  DollarSign,
  Star,
  Package,
  ExternalLink,
} from "lucide-react"

const normalizeSubType = (subType) => (subType || "").toLowerCase().replace(/\s/g, "")

const userFriendlySubTypeName = (subType) => {
  const norm = normalizeSubType(subType)
  if (norm === "normal") return "Normal"
  if (norm === "holofoil" || norm === "holo") return "Holo"
  if (norm === "reverseholofoil" || norm === "reverseholo") return "Reverse Holo"
  return subType
}

const subTypeColorClass = (subType) => {
  const norm = normalizeSubType(subType)
  if (norm === "normal") return "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
  if (norm === "holofoil" || norm === "holo")
    return "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200"
  if (norm === "reverseholofoil" || norm === "reverseholo")
    return "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200"
  return "bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200"
}

const Search = () => {
  const [groupIdMap, setGroupIdMap] = useState({})
  const [userId, setUserId] = useState(null)
  const [tcgcsvData, setTcgcsvData] = useState([])
  const [tcgcsvLoaded, setTcgcsvLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeQuery, setActiveQuery] = useState("")
  const [displayedCards, setDisplayedCards] = useState([])
  const [visibleCount, setVisibleCount] = useState(20)
  const [userCollection, setUserCollection] = useState(JSON.parse(localStorage.getItem("collection")) || {})
  const [messageInfo, setMessageInfo] = useState(null)
  const [viewMode, setViewMode] = useState("grid")
  const [isLoading, setIsLoading] = useState(false)
  const [filterBy, setFilterBy] = useState("all")
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)

  useEffect(() => {
    fetch(groupDataUrl)
      .then((res) => res.text())
      .then((text) => {
        Papa.parse(text, {
          header: true,
          complete: (result) => {
            const map = {}
            result.data.forEach((row) => {
              if (row.groupId && row.name) {
                map[row.groupId.trim()] = row.name.trim()
              }
            })
            setGroupIdMap(map)
          },
        })
      })
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchUserCollection = async () => {
      if (!userId) return
      const snap = await getDocs(collection(db, "users", userId, "collection"))
      const items = {}
      snap.forEach((docSnap) => {
        const data = docSnap.data()
        ;(data.subTypes || []).forEach((entry) => {
          const sub = typeof entry === "string" ? { name: entry, owned: false } : entry
          if (sub.owned) {
            items[`${data.productId}-${sub.name}`] = true
          }
        })
      })
      setUserCollection(items)
    }
    fetchUserCollection()
  }, [userId])

  const handleAddToCollection = async (card, subType) => {
    const key = `${card.productId}-${subType}`
    const updated = { ...userCollection, [key]: true }
    setUserCollection(updated)
    localStorage.setItem("collection", JSON.stringify(updated))

    const cleanedName = (card.cleanName || "[No Name]")
      .replace(/\b\d{1,3}(?:\/\d{1,3})?\b/g, "")
      .replace(/\b[A-Z]{2,5}\d{2,4}\b/g, "")
      .trim()

    setMessageInfo({ text: `${cleanedName} (${subType}) added to your collection`, type: "add" })
    setTimeout(() => setMessageInfo(null), 3000)

    if (userId) {
      const docRef = doc(db, "users", userId, "collection", `${card.productId}`)
      const existingDoc = await getDoc(docRef)
      let existingSubTypes = []

      if (existingDoc.exists()) {
        const data = existingDoc.data()
        existingSubTypes = (data.subTypes || []).map((st) => (typeof st === "string" ? { name: st, owned: false } : st))
      }

      const rawSubTypes = [
        ...new Set(
          (Array.isArray(card.prices) ? card.prices : [card.prices]).map((p) => p?.subTypeName).filter(Boolean),
        ),
      ]

      const updatedMap = {}
      rawSubTypes.forEach((name) => {
        updatedMap[name] = { name, owned: false }
      })
      existingSubTypes.forEach(({ name, owned }) => {
        updatedMap[name] = { name, owned }
      })

      // Ensure the chosen one is marked as owned
      updatedMap[subType] = { name: subType, owned: true }

      const subTypes = Object.values(updatedMap)

      await setDoc(docRef, {
        name: card.cleanName || "[No Name]",
        productId: card.productId,
        image: card.imageUrl || "",
        url: card.url || "",
        set: groupIdMap[card.groupId?.toString()] || card.set || card.Set || "",
        number:
          (card.extendedData || []).find((e) => e.name?.toLowerCase() === "number")?.value || card.extNumber || "",
        subTypes,
      })
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const keywords = searchQuery.toLowerCase().split(/\s+/).filter(Boolean)
    let filtered = tcgcsvData.filter((card) => {
      const target = `${card.cleanName || ""} ${card.name || ""} ${card.groupName || ""}`.toLowerCase()
      return keywords.every((kw) => target.includes(kw))
    })

    // Apply filter
    if (filterBy !== "all") {
      switch (filterBy) {
        case "set":
          filtered = filtered.sort((a, b) => (a.groupName || "").localeCompare(b.groupName || ""))
          break
        case "alphabetical":
          filtered = filtered.sort((a, b) => (a.cleanName || "").localeCompare(b.cleanName || ""))
          break
        case "price":
          // Mock price sorting
          filtered = filtered.sort(() => Math.random() - 0.5)
          break
        case "rarity":
          // Mock rarity sorting
          filtered = filtered.sort(() => Math.random() - 0.5)
          break
        default:
          break
      }
    }

    setActiveQuery(searchQuery)
    setVisibleCount(20)
    setDisplayedCards(filtered)

    setTimeout(() => setIsLoading(false), 500)
  }

  useEffect(() => {
    const fetchLocalCards = async () => {
      const res = await fetch("/data/cards.json")
      const allCards = await res.json()

      const sealedKeywords = [
        "booster pack",
        "booster box",
        "elite trainer box",
        "theme deck",
        "pre-release kit",
        "collection box",
        "gift box",
        "deck box",
        "mini portfolio",
        "build & battle",
        "battle arena",
        "battle deck",
        "box set",
        "collection",
        "pin collection",
        "tin",
        "value box",
        "v battle deck",
        "blister",
      ]

      const filtered = allCards.filter((row) => {
        const name = (row.name || "").toLowerCase()
        return !sealedKeywords.some((keyword) => name.includes(keyword))
      })

      setTcgcsvData(filtered)
      setTcgcsvLoaded(true)
    }

    fetchLocalCards()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        setVisibleCount((prev) => Math.min(prev + 20, displayedCards.length))
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [displayedCards])

  const filterOptions = [
    { value: "all", label: "All Cards" },
    { value: "set", label: "By Set" },
    { value: "alphabetical", label: "A-Z" },
    { value: "price", label: "By Price" },
    { value: "rarity", label: "By Rarity" },
  ]

  const handleCardClick = (card) => {
    setSelectedCard(card)
  }

  const CardDetailPanel = ({ card, onClose }) => {
    if (!card) return null

    // Mock price data
    const mockPrices = {
      normal: Math.floor(Math.random() * 50) + 5,
      holofoil: Math.floor(Math.random() * 100) + 20,
      reverseholofoil: Math.floor(Math.random() * 80) + 15,
    }

    return (
      <div className="card-detail-panel animate-slideInFromRight">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Card Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Card Image */}
          <div className="mb-6">
            <img
              src={card.imageUrl || "/placeholder.png"}
              alt={card.cleanName}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          {/* Card Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {(card.cleanName || "[No Name]")
                  .replace(/\b\d{1,3}(?:\/\d{1,3})?\b/g, "")
                  .replace(/\b[A-Z]{2,5}\d{2,4}\b/g, "")
                  .trim()}
              </h3>
              <p className="text-slate-600">{groupIdMap[card.groupId?.toString()] || card.set || card.Set}</p>
              <p className="text-slate-500 text-sm">
                #
                {(card.extendedData || []).find((e) => e.name?.toLowerCase() === "number")?.value ||
                  card.extNumber ||
                  "—"}
              </p>
            </div>

            {/* Variants */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Package size={16} />
                Variants
              </h4>
              <div className="space-y-2">
                {[
                  ...new Set(
                    (Array.isArray(card.prices) ? card.prices : [card.prices])
                      .map((p) => p?.subTypeName)
                      .filter(Boolean),
                  ),
                ].map((subType) => {
                  const key = `${card.productId}-${subType}`
                  const isOwned = userCollection[key]
                  const price = mockPrices[subType.toLowerCase()] || Math.floor(Math.random() * 30) + 10

                  return (
                    <div
                      key={subType}
                      className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                        isOwned
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{userFriendlySubTypeName(subType)}</p>
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <DollarSign size={12} />${price}
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            if (isOwned) {
                              const updated = { ...userCollection }
                              delete updated[key]

                              if (userId) {
                                const docRef = doc(db, "users", userId, "collection", `${card.productId}`)
                                const existingDoc = await getDoc(docRef)
                                if (existingDoc.exists()) {
                                  const data = existingDoc.data()
                                  const subTypes = (data.subTypes || []).map((entry) => {
                                    if (typeof entry === "string") {
                                      return { name: entry, owned: false }
                                    } else if (entry.name === subType) {
                                      return { ...entry, owned: false }
                                    }
                                    return entry
                                  })

                                  const hasAnyOwned = subTypes.some((st) => st.owned)
                                  if (hasAnyOwned) {
                                    await setDoc(docRef, { ...data, subTypes })
                                  } else {
                                    await deleteDoc(docRef)
                                  }
                                }
                              }

                              setUserCollection(updated)
                              localStorage.setItem("collection", JSON.stringify(updated))

                              const cleanedName = (card.cleanName || "[No Name]")
                                .replace(/\b\d{1,3}(?:\/\d{1,3})?\b/g, "")
                                .replace(/\b[A-Z]{2,5}\d{2,4}\b/g, "")
                                .trim()

                              setMessageInfo({
                                text: `${cleanedName} (${subType}) removed from collection`,
                                type: "remove",
                              })
                              setTimeout(() => setMessageInfo(null), 3000)
                            } else {
                              handleAddToCollection(card, subType)
                            }
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isOwned
                              ? "bg-emerald-500 text-white hover:bg-emerald-600"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                          }`}
                        >
                          {isOwned ? <Trash2 size={14} /> : <Plus size={14} />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Market Info */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Star size={16} />
                Market Info
              </h4>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Rarity:</span>
                  <span className="font-medium">Rare Holo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Market Price:</span>
                  <span className="font-medium text-green-600">${Math.floor(Math.random() * 100) + 20}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Last Sale:</span>
                  <span className="font-medium">${Math.floor(Math.random() * 80) + 15}</span>
                </div>
              </div>
            </div>

            {/* External Link */}
            {card.url && (
              <a
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} />
                View on TCGPlayer
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen section-gradient-1">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-12 animate-fadeInUp">
          <div className="inline-flex items-center gap-3 glass px-6 py-3 rounded-full text-sm font-semibold text-blue-700 mb-6 neon-blue">
            <Sparkles size={16} className="animate-pulse" />
            Discover Your Next Card
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4">
            Search{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Cards</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Find any Pokémon card from our extensive database with advanced search and filtering
          </p>
        </div>

        {/* Enhanced Search Bar */}
        <div className="mb-12 animate-fadeInUp">
          <form onSubmit={handleSearch} className="relative max-w-4xl mx-auto">
            <div className="card-container rounded-3xl p-8">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <SearchIcon size={24} className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, set, or any keyword..."
                    className="w-full pl-16 pr-6 py-5 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white shadow-sm font-medium"
                  />
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="flex items-center gap-3 px-6 py-5 border-2 border-slate-200 rounded-2xl hover:bg-slate-50 transition-all duration-300 bg-white shadow-sm font-medium"
                  >
                    <Filter size={20} className="text-slate-600" />
                    <span className="text-slate-700">{filterOptions.find((opt) => opt.value === filterBy)?.label}</span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-600 transition-transform ${showFilterDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                      {filterOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
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

                {/* Search Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 neon-blue"
                >
                  {isLoading ? "Searching..." : "Search"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Enhanced Controls */}
        {displayedCards.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 animate-fadeInUp">
            <div className="flex items-center gap-4">
              <div className="glass px-6 py-3 rounded-2xl">
                <span className="text-slate-700 font-semibold">
                  {displayedCards.length} cards found
                  {activeQuery && <span className="ml-2 text-blue-600">for "{activeQuery}"</span>}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg neon-blue"
                    : "glass text-slate-600 hover:bg-white/60"
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  viewMode === "list"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg neon-blue"
                    : "glass text-slate-600 hover:bg-white/60"
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Message Toast */}
        {messageInfo && (
          <div
            className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-8 py-4 rounded-2xl shadow-xl transition-all duration-500 animate-fadeInUp ${
              messageInfo.type === "remove"
                ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              {messageInfo.type === "add" ? <CheckCircle size={20} /> : <Trash2 size={20} />}
              <span className="font-semibold">{messageInfo.text}</span>
            </div>
          </div>
        )}

        {/* Enhanced Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-24">
            <div className="card-container rounded-3xl p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
              <p className="text-slate-600 font-semibold text-lg">Searching for cards...</p>
            </div>
          </div>
        )}

        {/* Enhanced Cards Grid */}
        {!isLoading && displayedCards.length > 0 && (
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {displayedCards.slice(0, visibleCount).map((card, idx) => (
              <div
                key={idx}
                className="group card-container rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:scale-105 animate-fadeInUp border border-slate-100 cursor-pointer"
                style={{ animationDelay: `${(idx % 20) * 0.05}s` }}
                onClick={() => handleCardClick(card)}
              >
                {/* Card Image */}
                <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                  <img
                    src={card.imageUrl || "/placeholder.png"}
                    alt={card.cleanName || "No Name"}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Enhanced Card Info */}
                <div className="p-6 space-y-4">
                  <div className="text-center">
                    <a
                      href={card.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 leading-tight"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(card.cleanName || "[No Name]")
                        .replace(/\b\d{1,3}(?:\/\d{1,3})?\b/g, "")
                        .replace(/\b[A-Z]{2,5}\d{2,4}\b/g, "")
                        .trim()}
                    </a>

                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-slate-500 font-semibold">
                        {groupIdMap[card.groupId?.toString()] || card.set || card.Set}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        #
                        {(card.extendedData || []).find((e) => e.name?.toLowerCase() === "number")?.value ||
                          card.extNumber ||
                          "—"}
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Variant Buttons - Circular */}
                  <div className="flex justify-center gap-2 flex-wrap">
                    {[
                      ...new Set(
                        (Array.isArray(card.prices) ? card.prices : [card.prices])
                          .map((p) => p?.subTypeName)
                          .filter(Boolean),
                      ),
                    ]
                      .sort((a, b) => {
                        if (a === "Normal") return -1
                        if (b === "Normal") return 1
                        return a.localeCompare(b)
                      })
                      .map((subType, i) => {
                        const key = `${card.productId}-${subType}`
                        const isOwned = userCollection[key]

                        return (
                          <button
                            key={i}
                            className={`group/btn relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                              isOwned
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400 text-white shadow-lg neon-cyan"
                                : `${subTypeColorClass(subType)} border-2`
                            } hover:scale-110 hover:shadow-lg`}
                            title={userFriendlySubTypeName(subType)}
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (isOwned) {
                                const updated = { ...userCollection }
                                delete updated[key]

                                if (userId) {
                                  const docRef = doc(db, "users", userId, "collection", `${card.productId}`)
                                  const existingDoc = await getDoc(docRef)
                                  if (existingDoc.exists()) {
                                    const data = existingDoc.data()
                                    const subTypes = (data.subTypes || []).map((entry) => {
                                      if (typeof entry === "string") {
                                        return { name: entry, owned: false }
                                      } else if (entry.name === subType) {
                                        return { ...entry, owned: false }
                                      }
                                      return entry
                                    })

                                    const hasAnyOwned = subTypes.some((st) => st.owned)
                                    if (hasAnyOwned) {
                                      await setDoc(docRef, { ...data, subTypes })
                                    } else {
                                      await deleteDoc(docRef)
                                    }
                                  }
                                }

                                setUserCollection(updated)
                                localStorage.setItem("collection", JSON.stringify(updated))

                                const cleanedName = (card.cleanName || "[No Name]")
                                  .replace(/\b\d{1,3}(?:\/\d{1,3})?\b/g, "")
                                  .replace(/\b[A-Z]{2,5}\d{2,4}\b/g, "")
                                  .trim()

                                setMessageInfo({
                                  text: `${cleanedName} (${subType}) removed from collection`,
                                  type: "remove",
                                })
                                setTimeout(() => setMessageInfo(null), 3000)
                              } else {
                                handleAddToCollection(card, subType)
                              }
                            }}
                          >
                            {isOwned ? (
                              <CheckCircle size={16} className="text-white" />
                            ) : (
                              <Plus size={16} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
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

        {/* Enhanced Empty State */}
        {!isLoading && displayedCards.length === 0 && activeQuery && (
          <div className="text-center py-24 animate-fadeInUp">
            <div className="card-container rounded-3xl p-16">
              <div className="w-32 h-32 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-8">
                <SearchIcon size={48} className="text-slate-500" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">No cards found</h3>
              <p className="text-slate-600 mb-8 text-lg">Try adjusting your search terms or browse our collection</p>
              <button
                onClick={() => {
                  setSearchQuery("")
                  setActiveQuery("")
                  setDisplayedCards([])
                  setFilterBy("all")
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 neon-blue"
              >
                Clear Search
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Load More */}
        {displayedCards.length > visibleCount && (
          <div className="text-center mt-16 animate-fadeInUp">
            <button
              onClick={() => setVisibleCount((prev) => Math.min(prev + 20, displayedCards.length))}
              className="glass text-blue-600 border-2 border-blue-600 px-10 py-4 rounded-2xl font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Load More Cards ({displayedCards.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
      {selectedCard && <CardDetailPanel card={selectedCard} onClose={() => setSelectedCard(null)} />}
    </div>
  )
}

export default Search
