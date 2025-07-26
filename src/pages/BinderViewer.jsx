"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { db, auth } from "../firebase"
import { doc, getDoc, deleteDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { ArrowLeft, Edit3, Trash2, Grid, Calendar, User } from "lucide-react"

const BinderViewer = () => {
  const { binderId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [binder, setBinder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    onAuthStateChanged(auth, setUser)
  }, [])

  useEffect(() => {
    if (user && binderId) {
      loadBinder()
    }
  }, [user, binderId])

  const loadBinder = async () => {
    try {
      const binderRef = doc(db, "users", user.uid, "binders", binderId)
      const binderDoc = await getDoc(binderRef)

      if (binderDoc.exists()) {
        setBinder({ id: binderId, ...binderDoc.data() })
      } else {
        navigate("/collection")
      }
    } catch (error) {
      console.error("Error loading binder:", error)
      navigate("/collection")
    }
    setLoading(false)
  }

  const deleteBinder = async () => {
    if (!window.confirm("Are you sure you want to delete this binder? This action cannot be undone.")) {
      return
    }

    try {
      await deleteDoc(doc(db, "users", user.uid, "binders", binderId))
      navigate("/collection")
    } catch (error) {
      console.error("Error deleting binder:", error)
      alert("Failed to delete binder")
    }
  }

  const editBinder = () => {
    navigate(`/binder-builder?edit=${binderId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    )
  }

  if (!binder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Binder Not Found</h2>
          <p className="text-gray-600 mb-6">The binder you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate("/collection")}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
          >
            Back to Collection
          </button>
        </div>
      </div>
    )
  }

  const filledSlots = binder.slots?.filter((slot) => slot.card).length || 0
  const totalSlots = binder.slots?.length || 0
  const completionPercentage = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fadeInUp">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/collection")}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-300"
            >
              <ArrowLeft size={18} />
              Back
            </button>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">{binder.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center gap-1">
                  <Grid size={14} />
                  {binder.size?.rows} × {binder.size?.cols}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  Created {binder.createdAt?.toDate().toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <User size={14} />
                  {filledSlots}/{totalSlots} cards ({completionPercentage}%)
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={editBinder}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-300"
            >
              <Edit3 size={18} />
              Edit
            </button>

            <button
              onClick={deleteBinder}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-300"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        </div>

        {/* Binder Display */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-fadeInUp">
          <div
            className="grid gap-4 p-6 bg-gradient-to-br from-gray-900 to-black rounded-2xl"
            style={{
              gridTemplateColumns: `repeat(${binder.size?.cols || 3}, 1fr)`,
              gridTemplateRows: `repeat(${binder.size?.rows || 3}, 1fr)`,
            }}
          >
            {(binder.slots || []).map((slot, index) => (
              <div
                key={slot.id || index}
                className="group relative aspect-[5/7] bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden"
              >
                {slot.card ? (
                  <>
                    <img
                      src={slot.card.imageUrl || "/placeholder.png"}
                      alt={slot.card.name}
                      className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Card info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-xs font-medium truncate">{slot.card.cleanName || slot.card.name}</p>
                      <p className="text-gray-300 text-xs truncate">#{slot.card.extNumber}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-600 opacity-50">
                    <Grid size={24} className="mb-2" />
                    <span className="text-xs">Empty</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {filledSlots} of {totalSlots} slots filled
            </span>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{completionPercentage}% complete</span>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BinderViewer
