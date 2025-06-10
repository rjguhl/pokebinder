// File: MasterSet.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { db, auth } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {
  FaArrowLeft,
  FaQuestionCircle,
  FaRegClone,
  FaRegCheckCircle,
  FaRegSave
} from 'react-icons/fa';

const MasterSet = () => {
  const [step, setStep] = useState(1);
  const [choice, setChoice] = useState('');
  const [pokemonList, setPokemonList] = useState([]);
  const [setList, setSetList] = useState([]);
  const [query, setQuery] = useState('');
  const [filteredList, setFilteredList] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [includeVariants, setIncludeVariants] = useState(false);
  const [cards, setCards] = useState([]);
  const [userCollection, setUserCollection] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [saveMessage, setSaveMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const pokemonRes = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=1000');
        const setsRes = await axios.get('https://api.pokemontcg.io/v2/sets', {
          headers: { 'X-Api-Key': import.meta.env.VITE_POKEMON_API_KEY }
        });
        setPokemonList(pokemonRes.data.results.map(p => p.name));
        setSetList(setsRes.data.data.map(s => s.name));
      } catch (err) {
        console.error('Failed to load lists:', err);
      }
    };
    fetchLists();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setFilteredList([]);
    } else {
      const list = choice === 'pokemon' ? pokemonList : setList;
      setFilteredList(list.filter(name => name.toLowerCase().includes(query.toLowerCase())).slice(0, 10));
    }
  }, [query, pokemonList, setList, choice]);

  const fetchUserCollection = async (uid) => {
    const snapshot = await getDocs(collection(db, 'users', uid, 'collection'));
    setUserCollection(snapshot.docs.map(doc => doc.id));
  };

  const handleBuild = async () => {
    if (!selectedOption || !user) return;
    setLoading(true);
    await fetchUserCollection(user.uid);

    try {
      const queryType = choice === 'pokemon'
        ? `name:"${selectedOption}"`
        : `set.name:"${selectedOption}"`;

      let allCards = [], page = 1, hasMore = true;

      while (hasMore) {
        const res = await axios.get('https://api.pokemontcg.io/v2/cards', {
          params: { q: queryType, pageSize: 250, page },
          headers: { 'X-Api-Key': import.meta.env.VITE_POKEMON_API_KEY }
        });
        allCards.push(...res.data.data);
        hasMore = res.data.data.length === 250;
        page++;
      }

      let fetchedCards = [];
      if (includeVariants) {
        allCards.forEach(card => {
          const finishes = card.finishes || ['normal'];
          finishes.forEach((finish) => {
            fetchedCards.push({
              ...card,
              variantFinish: finish,
              id: `${card.id}-${finish}`
            });
          });
        });
      } else {
        const seen = new Set();
        allCards.forEach(card => {
          const key = `${card.name}-${card.set.id}-${card.number}`;
          if (!seen.has(key)) {
            seen.add(key);
            fetchedCards.push(card);
          }
        });
      }

      fetchedCards.sort((a, b) => {
        const dateA = new Date(a.set?.releaseDate || '2100-01-01');
        const dateB = new Date(b.set?.releaseDate || '2100-01-01');
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
    
        const numA = parseInt(a.number.replace(/[^\d]/g, '')) || 0;
        const numB = parseInt(b.number.replace(/[^\d]/g, '')) || 0;
        return numA - numB;
      });
  
      setCards(fetchedCards);  
      setCurrentPage(0);
      setStep(4);
    } catch (err) {
      console.error('Error fetching cards:', err);
    }
    setLoading(false);
  };

  const handleSaveMasterSet = async () => {
    if (!user || !selectedOption || cards.length === 0) return;
    const ownedCount = cards.filter(card => userCollection.includes(card.id)).length;
    const docId = selectedOption.toLowerCase().replace(/\s+/g, '-');
    try {
      await setDoc(doc(db, 'users', user.uid, 'mastersets', docId), {
        name: selectedOption,
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
        <p className="text-sm text-gray-500 mb-4">Step {step} of 4</p>

        {step > 1 && step < 4 && (
          <button onClick={() => setStep(step - 1)} className="mb-4 inline-flex items-center text-indigo-600 hover:underline">
            <FaArrowLeft className="mr-1" /> Back
          </button>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-lg text-gray-700 flex items-center"><FaQuestionCircle className="mr-2 text-indigo-600" />Choose a starting point:</p>
            <div className="flex gap-4">
              <button onClick={() => { setChoice('pokemon'); setStep(2); }} className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">Pokémon</button>
              <button onClick={() => { setChoice('set'); setStep(2); }} className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">Set</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-lg text-gray-700 flex items-center"><FaRegClone className="mr-2 text-indigo-600" />Search and select a {choice}:</p>
            <input type="text" placeholder={`Search ${choice}...`} value={query} onChange={(e) => setQuery(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3" />
            {filteredList.length > 0 && (
              <ul className="bg-white border rounded max-h-60 overflow-auto">
                {filteredList.map((name) => (
                  <li key={name} onClick={() => { setSelectedOption(name); setQuery(name); setFilteredList([]); setStep(3); }} className="p-2 hover:bg-indigo-100 cursor-pointer capitalize">{name}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <p className="text-lg text-gray-700 flex items-center">
              <FaRegCheckCircle className="mr-2 text-indigo-600" />
              {choice === 'pokemon' ? 'Include variants like reverse holos, promos, or 1st edition?' : 'Include every possible card in the set or just one of each unique art?'}
            </p>
            <div className="flex gap-4">
              <button onClick={() => { setIncludeVariants(true); handleBuild(); }} className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">Include All Variants</button>
              <button onClick={() => { setIncludeVariants(false); handleBuild(); }} className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400">One of Each Only</button>
            </div>
          </div>
        )}

        {loading && <p className="text-center text-gray-500 mt-6 animate-pulse">Building your Master Set...</p>}

        {step === 4 && !loading && (
          <>
            <div className="flex gap-4 mb-6">
              <button onClick={handleSaveMasterSet} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center">
                <FaRegSave className="mr-2" /> Save Master Set
              </button>
            </div>
            {saveMessage && <p className="text-center text-sm text-green-600 mb-4">{saveMessage}</p>}

            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-col md:flex-row justify-center gap-6 w-full max-w-5xl">
                {[0, 9].map((offset) => (
                  <div key={offset} className="bg-black p-4 rounded-2xl grid grid-cols-3 gap-4 w-full max-w-md">
                    {Array.from({ length: 9 }, (_, i) => {
                      const card = paginatedCards[i + offset];
                      const owned = card && userCollection.includes(card.id);
                      return (
                        <div key={i + offset} className={`relative aspect-[5/7] bg-gray-800 rounded-lg flex items-center justify-center ${card ? (owned ? '' : 'opacity-50') : 'opacity-20'}`}>
                          {card && (
                            <>
                              <img src={card.images.small} alt={card.name} className="max-h-full max-w-full object-contain" />
                              {card.variantFinish && (
                                <div className="absolute top-1 right-1 bg-white text-gray-700 text-[10px] px-1 py-[1px] rounded shadow-md font-bold uppercase">
                                  {renderVariantBadge(card.variantFinish)}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center w-full max-w-md">
                <button onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50">Previous</button>
                <p className="text-sm text-gray-600">Page {currentPage + 1} of {totalPages}</p>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1} className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50">Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MasterSet;
