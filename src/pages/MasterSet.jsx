// File: MasterSet.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';

const MasterSet = () => {
  const [pokemonList, setPokemonList] = useState([]);
  const [query, setQuery] = useState('');
  const [filteredList, setFilteredList] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [cards, setCards] = useState([]);
  const [userCollection, setUserCollection] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const fetchPokemonList = async () => {
      try {
        const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=1000');
        const names = response.data.results.map((p) => p.name);
        setPokemonList(names);
      } catch (err) {
        console.error('Failed to load Pokémon list:', err);
      }
    };
    fetchPokemonList();
  }, []);

  useEffect(() => {
    if (query.trim() === '') {
      setFilteredList([]);
    } else {
      const q = query.toLowerCase();
      setFilteredList(pokemonList.filter((name) => name.includes(q)).slice(0, 10));
    }
  }, [query, pokemonList]);

  const fetchUserCollection = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const snapshot = await getDocs(collection(db, 'users', uid, 'collection'));
      const userCards = snapshot.docs.map((doc) => doc.id);
      setUserCollection(userCards);
    } catch (err) {
      console.error('Failed to load user collection:', err);
    }
  };

  const handleBuild = async () => {
    if (!selectedPokemon) return;
    setLoading(true);
    await fetchUserCollection();
    try {
      const response = await axios.get(
        `https://api.pokemontcg.io/v2/cards?q=name:\"${selectedPokemon}\"&pageSize=100`,
        {
          headers: {
            'X-Api-Key': import.meta.env.VITE_POKEMON_API_KEY,
          },
        }
      );
      setCards(response.data?.data || []);
      setCurrentPage(0);
    } catch (err) {
      console.error('Error fetching cards:', err);
    }
    setLoading(false);
  };

  const handleSaveMasterSet = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid || !selectedPokemon || cards.length === 0) return;

      const ownedCount = cards.filter(card => userCollection.includes(card.id)).length;

      await setDoc(doc(db, 'users', uid, 'mastersets', selectedPokemon), {
        name: selectedPokemon,
        totalCards: cards.length,
        ownedCards: ownedCount,
        cardIds: cards.map(c => c.id),
        createdAt: new Date(),
      });
      setSaveMessage('Master Set saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save master set:', err);
      setSaveMessage('Error saving master set.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const cardsPerPage = 18;
  const paginatedCards = cards.slice(
    currentPage * cardsPerPage,
    (currentPage + 1) * cardsPerPage
  );

  const totalPages = Math.ceil(cards.length / cardsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-700 mb-6">Build a Master Set</h1>

        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search Pokémon..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedPokemon(null);
            }}
            className="w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {filteredList.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow mt-1 max-h-60 overflow-auto">
              {filteredList.map((name) => (
                <li
                  key={name}
                  onClick={() => {
                    setSelectedPokemon(name);
                    setQuery(name);
                    setFilteredList([]);
                  }}
                  className="px-4 py-2 hover:bg-indigo-100 cursor-pointer text-sm text-gray-800"
                >
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={handleBuild}
            disabled={!selectedPokemon}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold shadow-md disabled:opacity-50"
          >
            Build Master Set
          </button>

          {cards.length > 0 && (
            <button
              onClick={handleSaveMasterSet}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold shadow-md"
            >
              Save Master Set
            </button>
          )}
        </div>

        {saveMessage && <p className="text-center text-sm text-green-600 mb-4">{saveMessage}</p>}

        {loading && <p className="text-gray-500">Loading cards...</p>}

        {cards.length > 0 && (
          <div className="bg-binder bg-cover bg-center rounded-xl p-6 shadow-inner">
            <div className="grid grid-cols-9 gap-4 bg-opacity-90">
              {Array.from({ length: cardsPerPage }, (_, i) => {
                const card = paginatedCards[i];
                const owned = card && userCollection.includes(card.id);
                return (
                  <div
                    key={i}
                    className={`w-full h-32 flex items-center justify-center border rounded-md shadow ${
                      card
                        ? owned
                          ? 'bg-white'
                          : 'bg-gray-200 opacity-50'
                        : 'bg-transparent'
                    }`}
                  >
                    {card && (
                      <img
                        src={card.images.small}
                        alt={card.name}
                        className="max-h-full object-contain"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
              >
                Previous
              </button>
              <p className="text-sm text-gray-600">
                Page {currentPage + 1} of {totalPages}
              </p>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterSet;