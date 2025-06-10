// File: Search.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { db, auth } from '../firebase';
import { collection, setDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortOption, setSortOption] = useState('price');
  const [alert, setAlert] = useState('');
  const [user, setUser] = useState(null);

  const observer = useRef();
  const lastCardRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const fetchCards = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.pokemontcg.io/v2/cards?q=name:*${query}*&pageSize=20&page=${page}`,
        {
          headers: {
            'X-Api-Key': import.meta.env.VITE_POKEMON_API_KEY,
          },
        }
      );
      const newCards = response.data.data;
      setResults(prev => [...prev, ...newCards]);
      setHasMore(newCards.length > 0);
    } catch (err) {
      console.error('Error fetching cards:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (page > 1) fetchCards();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setPage(1);
    setResults([]);
    fetchCards();
  };

  const addToCollection = async (card) => {
    if (!user) {
      setAlert('You must be signed in to add cards to your collection.');
      setTimeout(() => setAlert(''), 3000);
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'collection', card.id), {
        cardId: card.id,
        name: card.name,
        image: card.images.small,
        set: card.set.name,
        number: card.number,
      });
      setAlert(`${card.name} added to your collection.`);
      setTimeout(() => setAlert(''), 3000);
    } catch (err) {
      console.error('Failed to add card:', err);
      setAlert('Failed to add card.');
      setTimeout(() => setAlert(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-100 p-6 relative">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-indigo-700 mb-6">Search Cards</h1>

        {alert && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-indigo-100 border border-indigo-300 text-indigo-800 px-6 py-3 rounded-lg shadow-md transition-all animate-fade-in-out">
            {alert}
          </div>
        )}

        <form onSubmit={handleSearch} className="flex items-center gap-4 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Pokémon name, set, or number..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg shadow-md font-medium"
          >
            Search
          </button>
        </form>

        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {results.map((card, index) => (
              <div
                key={card.id}
                ref={index === results.length - 1 ? lastCardRef : null}
                className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
              >
                <img
                  src={card.images.small}
                  alt={card.name}
                  className="w-full h-48 object-contain mb-2"
                />
                <h2 className="text-sm font-semibold text-indigo-700 mb-1">{card.name}</h2>
                <p className="text-xs text-gray-500 mb-2">
                  {card.set.name} — {card.number}/{card.set.total}
                </p>
                <button
                  onClick={() => addToCollection(card)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium"
                >
                  Add to Collection
                </button>
              </div>
            ))}
          </div>
        )}

        {loading && <p className="text-center text-gray-500 mt-6">Loading more cards...</p>}
      </div>
    </div>
  );
};

export default Search;
