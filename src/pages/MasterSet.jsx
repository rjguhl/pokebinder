// File: MasterSet.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { FaArrowLeft, FaQuestionCircle, FaRegClone, FaRegCheckCircle, FaRegSave } from 'react-icons/fa';

const MasterSet = () => {
  const [cardsReady, setCardsReady] = useState(false);
  const [choice, setChoice] = useState('');
  const [pokemonList, setPokemonList] = useState([]);
  const [setList, setSetList] = useState([]);
  const [query, setQuery] = useState('');
  const [filteredList, setFilteredList] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [includeVariants, setIncludeVariants] = useState(false);
  const [cards, setCards] = useState([]);
  const [userCollection, setUserCollection] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [saveMessage, setSaveMessage] = useState('');
  const [user, setUser] = useState(null);
  const [sortOption, setSortOption] = useState('default');
  const [imageStatus, setImageStatus] = useState({});

  const handleAddToCollection = async (card) => {
    if (!user) return;
    const baseId = card.id.split('-')[0];
    const finish = card.variantFinish || 'normal';
    const cardId = `${baseId}-${finish}`;

    try {
      await setDoc(doc(db, 'users', user.uid, 'collection', cardId), {
        name: card.name,
        cardId,
        baseId,
        image: card.images?.small || null,
        number: card.number,
        set: card.set?.name || '',
        rarity: card.rarity || '',
        finish,
        addedAt: new Date(),
      });
      setUserCollection(prev => [...prev, cardId]);
    } catch (err) {
      console.error('Error adding to collection:', err);
    }
  };

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [pokemonRes, setsRes] = await Promise.all([
          axios.get('https://pokeapi.co/api/v2/pokemon?limit=1000'),
          axios.get('https://api.pokemontcg.io/v2/sets', {
            headers: { 'X-Api-Key': import.meta.env.VITE_POKEMON_API_KEY }
          })
        ]);
        setPokemonList(pokemonRes.data.results.map(p => p.name));
        setSetList(setsRes.data.data);
      } catch (err) {
        console.error('Failed to load lists:', err);
      }
    };
    fetchLists();
  }, []);

  useEffect(() => {
    const list = choice === 'pokemon' ? pokemonList : setList;
    if (!query.trim()) return setFilteredList([]);
    setFilteredList(
      list.filter(item => (choice === 'pokemon' ? item : item.name).toLowerCase().includes(query.toLowerCase())).slice(0, 10)
    );
  }, [query, pokemonList, setList, choice]);

  useEffect(() => {
    if (cards.length > 0) {
      const sorted = [...cards];
      sorted.sort((a, b) => {
        if (sortOption === 'alphabetical') {
          return a.name.localeCompare(b.name);
        } else if (sortOption === 'priceLowHigh' || sortOption === 'priceHighLow') {
          const getMinPrice = (card) => {
            const prices = Object.values(card.tcgplayer?.prices || {});
            return Math.min(...prices.map(p => p?.market || Infinity));
          };
          const direction = sortOption === 'priceHighLow' ? -1 : 1;
          return direction * (getMinPrice(a) - getMinPrice(b));
        } else {
          if (choice === 'pokemon') {
            return new Date(a.set?.releaseDate || '2100-01-01') - new Date(b.set?.releaseDate || '2100-01-01');
          } else {
            const numA = parseInt(a.number.replace(/[^\d]/g, '')) || 0;
            const numB = parseInt(b.number.replace(/[^\d]/g, '')) || 0;
            return numA - numB;
          }
        }
      });
      setCards(sorted);
    }
  }, [sortOption]);

  const fetchUserCollection = async (uid) => {
    const snapshot = await getDocs(collection(db, 'users', uid, 'collection'));
    setUserCollection(snapshot.docs.map(doc => doc.id));
  };

  const handleBuild = async () => {
    if (!selectedOption || !user) return;
    setCardsReady(false);
    setLoading(true);
    setCards([]); // reset before building again
    await fetchUserCollection(user.uid);

    try {
      const queryType = choice === 'pokemon'
        ? `name:"${selectedOption}"`
        : `set.id:"${selectedSetId}"`;

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

      const fetched = new Set();
      const variants = [];

      allCards.forEach(card => {
        if (includeVariants) {
          const finishes = Array.isArray(card.finishes) ? card.finishes : [];
          const prices = card.tcgplayer?.prices || {};
          const priceKeys = typeof prices === 'object' ? Object.keys(prices) : [];
          let variantKeys = [...new Set([...finishes, ...priceKeys])];
          if (variantKeys.length === 0) {
            variantKeys.push('normal');
          }

          const setId = card.set?.id?.toLowerCase() || '';
          if (setId === 'base1' && !variantKeys.includes('shadowless')) {
            variantKeys.push('shadowless');
          }
          if (
            /^(base1|base2|gym1|gym2|neo1|neo2|neo3|neo4|si1|si2|si3|si4)$/.test(setId) &&
            !variantKeys.includes('1stEdition')
          ) {
            variantKeys.push('1stEdition');
          }

          // Custom logic: Only add each finish once, mark if user owns it, don't duplicate if already present
          const userHas = new Set(userCollection); // already added
          variantKeys.forEach((variantKey, i) => {
            const newId = `${card.id}-${variantKey}-${i}`;
            const baseId = card.id;
            const hasAlready = userHas.has(`${baseId}-${variantKey}`);
            if (includeVariants || !hasAlready || i === 0) {
              variants.push({
                ...card,
                id: newId,
                variantFinish: variantKey,
              });
            }
          });
        } else {
          const key = `${card.name}-${card.set.id}-${card.number}`;
          if (!fetched.has(key)) {
            fetched.add(key);
            variants.push(card);
          }
        }
      });

      variants.sort((a, b) => {
        if (sortOption === 'alphabetical') {
          return a.name.localeCompare(b.name);
        } else if (sortOption === 'priceLowHigh' || sortOption === 'priceHighLow') {
          const getMinPrice = (card) => {
            const prices = Object.values(card.tcgplayer?.prices || {});
            return Math.min(...prices.map(p => p?.market || Infinity));
          };
          const direction = sortOption === 'priceHighLow' ? -1 : 1;
          return direction * (getMinPrice(a) - getMinPrice(b));
        } else {
            if (choice === 'pokemon') {
                const dateA = new Date(a.set?.releaseDate || '2100-01-01');
                const dateB = new Date(b.set?.releaseDate || '2100-01-01');
                if (dateA.getTime() !== dateB.getTime()) {
                  return dateA - dateB;
                }
                const numA = parseInt(a.number.replace(/[^\d]/g, '')) || 0;
                const numB = parseInt(b.number.replace(/[^\d]/g, '')) || 0;
                return numA - numB;
              } else {
            const numA = parseInt(a.number.replace(/[^\d]/g, '')) || 0;
            const numB = parseInt(b.number.replace(/[^\d]/g, '')) || 0;
            return numA - numB;
          }
        }
      });

      setCards(variants);
      setCurrentPage(0);
      setCardsReady(true);
    } catch (err) {
      console.error('Error fetching cards:', err);
    }
    setLoading(false);
  };

  const handleSaveMasterSet = async () => {
    if (!user || !selectedOption || cards.length === 0) return;
    const ownedCount = cards.filter(card => userCollection.includes(card.id)).length;
    const docId = choice === 'set'
        ? `${selectedOption.toLowerCase().replace(/\s+/g, '-')}-${selectedSetId}`
        : selectedOption.toLowerCase().replace(/\s+/g, '-');
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
  const paginatedCards = cards.slice(currentPage * cardsPerPage, (currentPage + 1) * cardsPerPage);
  const totalPages = Math.ceil(cards.length / cardsPerPage);

  const renderVariantBadge = (variant) => {
    const labelMap = {
      holofoil: 'Holo',
      reverseHolofoil: 'Reverse',
      pokeball: 'Poké Ball',
      masterball: 'Master Ball',
      shadowless: 'Shadowless',
      '1stEdition': '1st Ed',
      normal: 'Normal',
    };
    return labelMap[variant] || variant;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-700 mb-6">Build a Master Set</h1>
        <div className="space-y-6 bg-white p-6 rounded-xl shadow-md mb-6">
        <p className="text-xl font-semibold text-gray-800 flex items-center">
            <FaQuestionCircle className="mr-3 text-indigo-600" />Build a Master Set
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
            <button
            onClick={() => { setChoice('pokemon'); setQuery(''); setSelectedOption(null); setFilteredList([]); }}
            className={`flex-1 py-3 rounded-lg text-lg ${choice === 'pokemon' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
            Pokémon
            </button>
            <button
            onClick={() => { setChoice('set'); setQuery(''); setSelectedOption(null); setFilteredList([]); }}
            className={`flex-1 py-3 rounded-lg text-lg ${choice === 'set' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
            Set
            </button>
        </div>

        <input
            type="text"
            placeholder={`Search ${choice}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-indigo-400"
        />
        {filteredList.length > 0 && (
            <ul className="bg-white border rounded-lg shadow max-h-60 overflow-auto">
              {filteredList.map((item) => (
                <li
                  key={choice === 'pokemon' ? item : item.id}
                  onClick={() => {
                    const name = choice === 'pokemon' ? item : item.name;
                    const id = choice === 'set' ? item.id : null;
                    setQuery(name);
                    setFilteredList([]);
                    setSelectedOption(name);
                    if (id) setSelectedSetId(id);
                  }}
                  className="p-3 hover:bg-indigo-100 cursor-pointer capitalize text-gray-700"
                >
                  {choice === 'pokemon' ? item : item.name}
                </li>
              ))}
            </ul>
        )}

        <div className="mt-4">
          <p className="text-lg font-medium text-gray-800 mb-2">
            Variant Detail Level:
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Choose whether you want one of each card, or to include all known finishes like Reverse Holos, 1st Editions, Shadowless, and special ball prints (e.g. Poké Ball, Master Ball).
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setIncludeVariants(true)}
              className={`flex-1 py-3 rounded-lg text-lg font-semibold ${includeVariants ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              Include All Variants
            </button>
            <button
              onClick={() => setIncludeVariants(false)}
              className={`flex-1 py-3 rounded-lg text-lg font-semibold ${!includeVariants ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              One of Each Only
            </button>
          </div>
        </div>

        <div className="text-center">
            <button
            onClick={handleBuild}
            disabled={!selectedOption || loading}
            className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg text-lg hover:bg-green-700 disabled:opacity-50"
            >
            Build Master Set
            </button>
            {loading && (
              <p className="text-center text-gray-500 mt-4 animate-pulse">Building your Master Set...</p>
            )}
        </div>
        </div>

        {cardsReady && !loading && (
  <>
    <div className="flex gap-4 mb-6 justify-between items-center">
      <button onClick={handleSaveMasterSet} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center">
        <FaRegSave className="mr-2" /> Save Master Set
      </button>
      <select
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
      >
        <option value="default">Sort by Default</option>
        <option value="alphabetical">Sort Alphabetically</option>
        <option value="priceLowHigh">Sort by Price (Low → High)</option>
        <option value="priceHighLow">Sort by Price (High → Low)</option>
      </select>
    </div>

    {saveMessage && <p className="text-center text-sm text-green-600 mb-4">{saveMessage}</p>}

    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col md:flex-row justify-center gap-6 w-full max-w-5xl">
        {[0, 9].map((offset) => (
          <div key={offset} className="bg-black p-4 rounded-2xl grid grid-cols-3 gap-4 w-full max-w-md">
            {Array.from({ length: 9 }, (_, i) => {
              const card = paginatedCards[i + offset];
              const finishKey = card?.variantFinish || 'normal';
              const cardId = card?.id ? card.id.split('-')[0] + '-' + finishKey : undefined;
              const cardKey = cardId || `placeholder-${i + offset}`;
              const owned = card && userCollection.includes(cardId);
              const isLoaded = imageStatus[cardKey];

              return (
                <div
                  key={i + offset}
                  className={`relative aspect-[5/7] bg-gray-800 rounded-lg flex items-center justify-center ${
                    card ? (owned ? '' : 'opacity-50') : 'opacity-20'
                  }`}
                >
                  {card && (
                    <>
                      <img
                        src={card.images?.small}
                        alt={card.name}
                        onLoad={() => setImageStatus(prev => ({ ...prev, [cardKey]: true }))}
                        onError={(e) => {
                          if (!e.currentTarget.src.includes('placeholder.png')) {
                            e.currentTarget.src = '/placeholder.png';
                          }
                        }}
                        className={`max-h-full max-w-full object-contain ${isLoaded ? '' : 'hidden'}`}
                      />
                      {!isLoaded && (
                        <div className="w-full h-full bg-gray-300 animate-pulse rounded-lg" />
                      )}
                      {isLoaded && card.variantFinish && card.variantFinish !== 'normal' &&
                        (Array.isArray(card.finishes) && card.finishes.length > 1 ||
                        Object.keys(card.tcgplayer?.prices || {}).length > 1) && (
                          <div className="absolute top-1 right-1 bg-white text-gray-700 text-[10px] px-1 py-[1px] rounded shadow-md font-bold uppercase">
                            {renderVariantBadge(card.variantFinish)}
                          </div>
                      )}
                      {/* Overlay for adding to collection */}
                      {!owned && (
                        <button
                          onClick={() => handleAddToCollection(card)}
                          className="absolute bottom-1 right-1 bg-green-600 text-white px-2 py-[2px] rounded text-[10px] hover:bg-green-700 transition-all shadow"
                        >
                          + Add
                        </button>
                      )}
                      {owned && (
                        <div className="absolute bottom-1 right-1 flex items-center text-green-600 text-[10px] font-bold bg-white px-2 py-[2px] rounded shadow">
                          <FaRegCheckCircle className="mr-1 text-[10px]" /> Owned
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

      <div className="flex justify-between items-center w-full max-w-md mt-4">
        <button onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50">
          Previous
        </button>
        <p className="text-sm text-gray-600">Page {currentPage + 1} of {totalPages}</p>
        <button onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50">
          Next
        </button>
      </div>
    </div>
  </>
)}
      </div>
    </div>
  );
};

export default MasterSet;
