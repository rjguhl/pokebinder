import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { db, auth } from '../firebase';
import {
  collection,
  setDoc,
  doc,
  getDocs,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const Search = () => {
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState([]);
  const [user, setUser] = useState(null);
  const [userCollection, setUserCollection] = useState({});
  const [dropdownCardId, setDropdownCardId] = useState(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchCollection = async () => {
      const snapshot = await getDocs(collection(db, 'users', user.uid, 'collection'));
      const collectionMap = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!collectionMap[data.baseId]) collectionMap[data.baseId] = new Set();
        collectionMap[data.baseId].add(data.finish);
      });
      setUserCollection(collectionMap);
    };
    fetchCollection();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownCardId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!queryText.trim()) return;
  
    setLoading(true);
    try {
      const parts = queryText.trim().split(/\s+/);
      let q = '';
  
      if (parts.length === 2) {
        const [first, second] = parts;
        const isSecondNumber = /^\d+$/.test(second);
        if (isSecondNumber) {
          q = `name:*${first}* AND number:${second}`;
        } else {
          q = `name:*${first}* AND set.name:*${second}*`;
        }
      } else {
        const text = parts.join(' ');
        q = `name:*${text}* OR set.name:*${text}* OR number:${text}`;
      }
  
      const res = await axios.get('https://api.pokemontcg.io/v2/cards', {
        params: {
          q,
          pageSize: 30,
        },
        headers: { 'X-Api-Key': import.meta.env.VITE_POKEMON_API_KEY },
      });
  
      setResults(res.data.data);
    } catch (err) {
      console.error('Error fetching cards:', err);
    }
    setLoading(false);
  };

  const addToCollection = async (card, finish) => {
    if (!user) return;
    try {
      const cardId = `${card.id}-${finish}`;
      const docRef = doc(db, 'users', user.uid, 'collection', cardId);
      await setDoc(docRef, {
        cardId,
        baseId: card.id,
        name: card.name,
        image: card.images?.small,
        set: card.set.name,
        number: card.number,
        rarity: card.rarity,
        finish,
        timestamp: new Date(),
      });

      // Local update to show check immediately
      setUserCollection((prev) => {
        const updated = { ...prev };
        const baseKey = card.baseId || card.id;
        if (!updated[baseKey]) updated[baseKey] = new Set();
        updated[baseKey] = new Set([...updated[baseKey], finish]);
        return updated;
      });
    } catch (err) {
      console.error('Error adding to collection:', err);
    }
  };

  const getFinishVariants = (card) => {
    const base = ['normal'];
    const finishes = new Set(card.finishes || base);

    if ((card.rarity === 'Common' || card.rarity === 'Uncommon') && !finishes.has('reverseHolofoil')) {
      finishes.add('reverseHolofoil');
    }

    return Array.from(finishes).map(f =>
      f === 'reverseHolofoil' ? 'Reverse Holo'
      : f === 'normal' ? 'Normal'
      : f.charAt(0).toUpperCase() + f.slice(1)
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-indigo-700 mb-6">Search Cards</h1>
        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search by name, set, or number..."
            className="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Search
          </button>
        </form>

        {loading && (
          <p className="text-center text-gray-500 mb-4 animate-pulse">Loading results...</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {results.map((card) => {
            const finishes = getFinishVariants(card);
            return (
              <div key={card.id} className="relative bg-white p-3 rounded-xl shadow hover:shadow-lg transition-transform">
                {(() => {
                  const ownedCount = (userCollection[card.id]?.size || userCollection[card.baseId]?.size || 0);
                  const badgeColor = ownedCount === 0 ? 'bg-red-500' : 'bg-indigo-600';
                  return (
                    <div className={`absolute top-1 left-1 ${badgeColor} text-white text-[10px] px-2 py-[1px] rounded-full font-semibold shadow-md`}>
                      {ownedCount}/{finishes.length}
                    </div>
                  );
                })()}
                <img
                  src={card.images?.small || '/placeholder.png'}
                  alt={card.name}
                  className="w-full h-40 object-contain mb-2"
                />
                <h2 className="text-sm font-medium text-indigo-600">{card.name}</h2>
                <p className="text-xs text-gray-500">
                  {card.set?.name} — {card.number}
                </p>
                <button
                  onClick={() => setDropdownCardId(card.id)}
                  className="absolute bottom-2 right-2 text-green-600 bg-white border border-green-600 px-2 py-1 text-xs rounded hover:bg-green-100"
                >
                  + Add
                </button>
                {dropdownCardId === card.id && (
                  <div
                    ref={dropdownRef}
                    className="absolute bottom-10 right-1 bg-white border border-indigo-200 rounded-lg shadow-lg text-sm z-30 min-w-[140px]"
                  >
                    {finishes.map((finish) => {
                      // Use baseId to group user-owned finishes
                      const ownedSet = userCollection[card.id] || userCollection[card.baseId] || new Set();
                      const hasIt = ownedSet.has(finish);

                      return (
                        <button
                          key={finish}
                          onClick={async () => {
                            if (!hasIt) {
                              await addToCollection(card, finish);
                            }
                            setDropdownCardId(null);
                          }}
                          disabled={hasIt}
                          className={`w-full text-left px-4 py-2 flex justify-between items-center transition-colors ${
                            hasIt
                              ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                              : 'hover:bg-indigo-50 text-gray-800'
                          }`}
                        >
                          <span>{finish}</span>
                          {hasIt && <span className="text-green-500 font-bold">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Search;