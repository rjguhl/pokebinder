"use client"

import groupDataUrl from "../../PokemonGroups.csv?url"
import Papa from "papaparse"
import { useState, useEffect } from "react"
import { db, auth } from "../firebase"
import { collection, setDoc, doc, getDocs, deleteDoc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Trash2, CheckCircle, Plus, SearchIcon, Grid, List, Sparkles } from "lucide-react"

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
        existingSubTypes = (data.subTypes || []).map((st) =>
          typeof st === "string" ? { name: st, owned: false } : st
        )
      }

      const rawSubTypes = [
        ...new Set(
          (Array.isArray(card.prices) ? card.prices : [card.prices])
            .map((p) => p?.subTypeName)
            .filter(Boolean)
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
      console.log("Saved to Firestore:", {
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
    const filtered = tcgcsvData.filter((card) => {
      const target = `${card.cleanName || ""} ${card.name || ""} ${card.groupName || ""}`.toLowerCase()
      return keywords.every((kw) => target.includes(kw))
    })

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 px-4 py-2 rounded-full text-sm font-medium text-indigo-700 mb-4">
            <Sparkles size={16} className="animate-pulse" />
            Discover Your Next Card
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Search{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Cards</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find any Pokémon card from our extensive database with advanced search and filtering
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 animate-fadeInUp">
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="relative">
              <SearchIcon size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, set, or any keyword..."
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white shadow-lg"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        {/* Controls */}
        {displayedCards.length > 0 && (
          <div className="flex justify-between items-center mb-8 animate-fadeInUp">
            <div className="flex items-center gap-4">
              <span className="text-gray-600 font-medium">
                {displayedCards.length} cards found
                {activeQuery && <span className="ml-2 text-indigo-600">for "{activeQuery}"</span>}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === "grid" ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === "list" ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Message Toast */}
        {messageInfo && (
          <div
            className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg transition-all duration-500 animate-fadeInUp ${
              messageInfo.type === "remove"
                ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              {messageInfo.type === "add" ? <CheckCircle size={18} /> : <Trash2 size={18} />}
              {messageInfo.text}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        )}

        {/* Cards Grid */}
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
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:scale-105 animate-fadeInUp border border-gray-100"
                style={{ animationDelay: `${(idx % 20) * 0.05}s` }}
              >
                {/* Card Image */}
                <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  <img
                    src={card.imageUrl || "/placeholder.png"}
                    alt={card.cleanName || "No Name"}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Card Info */}
                <div className="p-4 space-y-3">
                  <div className="text-center">
                    <a
                      href={card.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-2 leading-tight"
                    >
                      {(card.cleanName || "[No Name]")
                        .replace(/\b\d{1,3}(?:\/\d{1,3})?\b/g, "")
                        .replace(/\b[A-Z]{2,5}\d{2,4}\b/g, "")
                        .trim()}
                    </a>

                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500 font-medium">
                        {groupIdMap[card.groupId?.toString()] || card.set || card.Set}
                      </p>
                      <p className="text-xs text-gray-400">
                        #
                        {(card.extendedData || []).find((e) => e.name?.toLowerCase() === "number")?.value ||
                          card.extNumber ||
                          "—"}
                      </p>
                    </div>
                  </div>

                  {/* Variant Buttons */}
                  <div className="flex justify-center gap-1 flex-wrap">
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
                            className={`group/btn relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                              isOwned
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 border-green-400 text-white shadow-lg"
                                : `${subTypeColorClass(subType)} border-2`
                            } hover:scale-110 hover:shadow-lg`}
                            title={userFriendlySubTypeName(subType)}
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
                          >
                            {isOwned ? (
                              <CheckCircle size={14} className="text-white" />
                            ) : (
                              <Plus size={14} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
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

        {/* Empty State */}
        {!isLoading && displayedCards.length === 0 && activeQuery && (
          <div className="text-center py-20 animate-fadeInUp">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <SearchIcon size={32} className="text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No cards found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search terms or browse our collection</p>
            <button
              onClick={() => {
                setSearchQuery("")
                setActiveQuery("")
                setDisplayedCards([])
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Load More */}
        {displayedCards.length > visibleCount && (
          <div className="text-center mt-12 animate-fadeInUp">
            <button
              onClick={() => setVisibleCount((prev) => Math.min(prev + 20, displayedCards.length))}
              className="bg-white text-indigo-600 border-2 border-indigo-600 px-8 py-3 rounded-xl font-medium hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Load More Cards
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
