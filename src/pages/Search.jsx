import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { db, auth } from '../firebase';
import {
  collection,
  setDoc,
  doc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Trash2 } from 'react-feather';

const normalizeSubType = (subType) =>
  (subType || '').toLowerCase().replace(/\s/g, '');

const userFriendlySubTypeName = (subType) => {
  const norm = normalizeSubType(subType);
  if (norm === 'normal') return 'Normal';
  if (norm === 'holofoil' || norm === 'holo') return 'Holo';
  if (norm === 'reverseholofoil' || norm === 'reverseholo') return 'Reverse Holo';
  return subType;
};

const subTypeColorClass = (subType) => {
  const norm = normalizeSubType(subType);
  if (norm === 'normal') return 'bg-gray-300 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600';
  if (norm === 'holofoil' || norm === 'holo') return 'bg-yellow-200 text-yellow-700 hover:bg-yellow-300 hover:text-yellow-800';
  if (norm === 'reverseholofoil' || norm === 'reverseholo') return 'bg-blue-200 text-blue-700 hover:bg-blue-300 hover:text-blue-800';
  return 'bg-purple-200 text-purple-700 hover:bg-purple-300 hover:text-purple-800';
};

const allKnownSubTypes = ['Normal', 'Holofoil', 'Reverse Holo', 'Full Art', 'Promo', 'Glossy', 'Foil'];

const Search = () => {
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState([]);
  const [user, setUser] = useState(null);
  const [userCollection, setUserCollection] = useState({});
  // No dropdown state needed for variants now
  const [loading, setLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [tcgcsvData, setTcgcsvData] = useState([]);
  const [tcgcsvLoaded, setTcgcsvLoaded] = useState(false);

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
        collectionMap[data.baseId].add(normalizeSubType(data.finish)); // finish is now considered subType
      });
      setUserCollection(collectionMap);
    };
    fetchCollection();
  }, [user]);

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const result = [];
    let headers = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // Simple CSV parsing, assuming no quoted commas
      const values = line.split(',');
      if (i === 0) {
        headers = values;
      } else {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = values[j] || '';
        }
        result.push(obj);
      }
    }
    return result;
  };

  // Fetch TCGCSV data from Firestore instead of remote CSV
  const fetchTCGCSVFromFirestore = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'tcgcsv'));
      const rows = [];
      snapshot.forEach(doc => {
        rows.push(doc.data());
      });
      // Debug log: show first few rows of TCGCSV from Firestore
      console.log('[TCGCSV][Firestore] First few rows:', rows.slice(0, 5));
      setTcgcsvData(rows);
      setTcgcsvLoaded(true);
    } catch (err) {
      console.error('Error fetching TCGCSV data from Firestore:', err);
      setTcgcsvLoaded(false);
    }
  };

  // Normalize TCGCSV SubTypeName values to standard label equivalents
  const normalizeTCGCSVSubType = (subType) => {
    if (!subType) return '';
    const val = subType.trim().toLowerCase();
    if (val === 'normal' || val === 'non-holo' || val === 'standard') return 'Normal';
    if (val === 'holofoil' || val === 'holo' || val === 'holo foil' || val === 'foil') return 'Holo';
    if (val === 'reverse holo' || val === 'reverse holofoil' || val === 'reverseholofoil' || val === 'reverseholo') return 'Reverse Holo';
    if (val === 'full art') return 'Full Art';
    if (val === 'promo') return 'Promo';
    if (val === 'glossy') return 'Glossy';
    // Add more as needed
    return subType.trim();
  };

  const getSubTypesFromTCGCSV = (card) => {
    if (!tcgcsvLoaded || !tcgcsvData.length) return [];
    // Normalize helpers
    const trimLower = (s) => (s || '').toString().trim().toLowerCase();
    // Log the actual card fields for debugging
    console.log('[TCGCSV][DEBUG] card.set?.name:', card.set?.name, '| card.name:', card.name, '| card.number:', card.number);
    const cardNameNorm = trimLower(card.name);
    const setNameNorm = trimLower(card.set?.name || '');
    const cardNumberNorm = trimLower(card.number || '');

    // Find all rows matching by name, set, and number (all normalized, trimmed)
    const matchingRows = tcgcsvData.filter(row => {
      // Defensive: skip if missing any important field
      if (!row.Name || !row.Set || !row.Number) return false;
      // Compare using trimmed, lowercased values
      return (
        trimLower(row.Name) === cardNameNorm &&
        trimLower(row.Set) === setNameNorm &&
        trimLower(row.Number) === cardNumberNorm
      );
    });

    // If not found, try fallback: match name+set only
    let usedMatchingRows = matchingRows;
    if (usedMatchingRows.length === 0) {
      usedMatchingRows = tcgcsvData.filter(row => {
        if (!row.Name || !row.Set) return false;
        return (
          trimLower(row.Name) === cardNameNorm &&
          trimLower(row.Set) === setNameNorm
        );
      });
      // If any partial matches, log them for debug
      if (usedMatchingRows.length > 0) {
        console.log('[TCGCSV][DEBUG] Fallback: matched by name+set only. Example rows:', usedMatchingRows.slice(0, 3));
      }
    }

    // If still not found, try fallback: match name only
    if (usedMatchingRows.length === 0) {
      usedMatchingRows = tcgcsvData.filter(row => {
        if (!row.Name) return false;
        return trimLower(row.Name) === cardNameNorm;
      });
      if (usedMatchingRows.length > 0) {
        console.log('[TCGCSV][DEBUG] Fallback: matched by name only. Example rows:', usedMatchingRows.slice(0, 3));
      }
    }

    if (!usedMatchingRows.length) {
      console.log(`[TCGCSV] No rows found for card "${card.name}" (${card.set?.name} #${card.number})`);
      // For debug: log some example rows from TCGCSV with those fields
      const nameMatches = tcgcsvData.filter(row => trimLower(row.Name) === cardNameNorm);
      if (nameMatches.length) {
        console.log('[TCGCSV][DEBUG] Example rows with matching Name:', nameMatches.slice(0, 3));
      }
      const setMatches = tcgcsvData.filter(row => trimLower(row.Set) === setNameNorm);
      if (setMatches.length) {
        console.log('[TCGCSV][DEBUG] Example rows with matching Set:', setMatches.slice(0, 3));
      }
      const numberMatches = tcgcsvData.filter(row => trimLower(row.Number) === cardNumberNorm);
      if (numberMatches.length) {
        console.log('[TCGCSV][DEBUG] Example rows with matching Number:', numberMatches.slice(0, 3));
      }
      return [];
    }

    // Log all matching rows
    console.log(`[TCGCSV] Matching rows for card "${card.name}" (${card.set?.name} #${card.number}):`, usedMatchingRows);

    // Use ProductID from the first matching row
    const matchedProductID = usedMatchingRows[0].ProductID;
    if (!matchedProductID) {
      console.log(`[TCGCSV] No ProductID found for card "${card.name}"`);
      return [];
    }

    // Gather all rows with same ProductID
    const rowsWithSameProductID = tcgcsvData.filter(row => row.ProductID === matchedProductID);
    // Log all rows with same ProductID
    console.log(`[TCGCSV] All rows with ProductID ${matchedProductID}:`, rowsWithSameProductID);

    // Collect unique normalized subtypes
    const subTypeSet = new Set();
    for (const row of rowsWithSameProductID) {
      if (row.SubTypeName && row.SubTypeName.trim() !== '') {
        const normalized = normalizeTCGCSVSubType(row.SubTypeName);
        subTypeSet.add(normalized);
        // Debug log for each row processed with ProductID matches
        console.debug(`[TCGCSV] ProductID ${matchedProductID}: Row SubTypeName "${row.SubTypeName}" normalized to "${normalized}"`);
      }
    }
    const subTypesArr = Array.from(subTypeSet);
    console.log(`[TCGCSV] Final subtypes for card "${card.name}" (${card.set?.name} #${card.number}):`, subTypesArr);
    return subTypesArr;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!queryText.trim()) return;

    if (!tcgcsvLoaded) {
      await fetchTCGCSVFromFirestore();
    }

    setLoading(true);
    setResults([]);

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

      // Fetch from PokéAPI
      const res = await axios.get('https://api.pokemontcg.io/v2/cards', {
        params: {
          q,
          pageSize: 30,
          select: 'id,name,images,set,number,rarity,finishes,totalFinishes,variantFinishes,ownedFinishes',
        },
        headers: { 'X-Api-Key': import.meta.env.VITE_POKEMON_API_KEY },
      });
      // Enrich each card with full details from /v2/cards/{id}
      const detailedResults = await Promise.all(
        res.data.data.map(card =>
          axios
            .get(`https://api.pokemontcg.io/v2/cards/${card.id}`, {
              headers: { 'X-Api-Key': import.meta.env.VITE_POKEMON_API_KEY }
            })
            .then(r => r.data.data)
        )
      );
      setResults(detailedResults);
    } catch (err) {
      console.error('Error fetching cards:', err);
    }
    setLoading(false);
  };

  // Determine all possible subTypes for a card, considering totalFinishes and variantFinishes
  const getAllPossibleSubTypes = (card) => {
    // If variantFinishes array exists, use it normalized
    if (Array.isArray(card.variantFinishes) && card.variantFinishes.length > 0) {
      const subTypes = card.variantFinishes;
      console.log(`[SubTypes] ${card.name} (${card.id}):`, subTypes);
      return subTypes;
    }
    // If finishes array exists, use it
    if (Array.isArray(card.finishes) && card.finishes.length > 0) {
      const subTypes = card.finishes;
      console.log(`[SubTypes] ${card.name} (${card.id}):`, subTypes);
      return subTypes;
    }
    // If ownedFinishes exists, use it
    if (Array.isArray(card.ownedFinishes) && card.ownedFinishes.length > 0) {
      const subTypes = card.ownedFinishes;
      console.log(`[SubTypes] ${card.name} (${card.id}):`, subTypes);
      return subTypes;
    }
    // If TCGCSV data loaded, try to get subTypes from it
    if (tcgcsvLoaded) {
      const csvSubTypes = getSubTypesFromTCGCSV(card);
      if (csvSubTypes.length > 0) {
        const subTypes = csvSubTypes;
        console.log(`[SubTypes] ${card.name} (${card.id}):`, subTypes);
        return subTypes;
      }
    }
    // If totalFinishes is a number, infer from known subTypes (up to totalFinishes count)
    if (typeof card.totalFinishes === 'number' && card.totalFinishes > 0) {
      const subTypes = allKnownSubTypes.slice(0, card.totalFinishes);
      console.log(`[SubTypes] ${card.name} (${card.id}):`, subTypes);
      return subTypes;
    }
    // Default fallback
    const subTypes = ['Normal'];
    console.log(`[SubTypes] ${card.name} (${card.id}):`, subTypes);
    return subTypes;
  };

  const addToCollection = async (card, subType) => {
    if (!user) return;
    try {
      // For Bulbapedia cards, card.baseId may already be set; for PokéAPI cards use card.id
      const baseKey = card.baseId || card.id;
      const normalizedSubType = normalizeSubType(subType);
      const cardId = `${baseKey}-${normalizedSubType}`;
      const docRef = doc(db, 'users', user.uid, 'collection', cardId);

      const ownedSet = userCollection[baseKey] || new Set();
      const hasIt = ownedSet.has(normalizedSubType);

      if (hasIt) {
        // Remove from collection
        await deleteDoc(docRef);
        setUserCollection((prev) => {
          const updated = { ...prev };
          if (updated[baseKey]) {
            const newSet = new Set(updated[baseKey]);
            newSet.delete(normalizedSubType);
            if (newSet.size === 0) {
              delete updated[baseKey];
            } else {
              updated[baseKey] = newSet;
            }
          }
          return updated;
        });
      } else {
        // Add to collection
        await setDoc(docRef, {
          cardId,
          baseId: baseKey,
          name: card.name,
          image: card.image || card.images?.small || '/placeholder.png',
          set: card.set,
          number: card.number,
          rarity: card.rarity,
          finish: subType, // still stored as finish for backwards compatibility
          timestamp: new Date(),
        });

        // Local update to show check immediately
        setUserCollection((prev) => {
          const updated = { ...prev };
          if (!updated[baseKey]) updated[baseKey] = new Set();
          updated[baseKey] = new Set([...updated[baseKey], normalizedSubType]);
          return updated;
        });
      }
    } catch (err) {
      console.error('Error adding to collection:', err);
    }
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

        {/* PokéAPI Results Section */}
        {results.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
              {results.map((card) => {
                const possibleSubTypes = getAllPossibleSubTypes(card);
                const baseKey = card.baseId || card.id;
                const ownedSet = userCollection[baseKey] || new Set();

                // Count owned subtypes by normalizing and checking membership
                const ownedCount = possibleSubTypes.reduce((count, subType) => {
                  return ownedSet.has(normalizeSubType(subType)) ? count + 1 : count;
                }, 0);
                const badgeColor = ownedCount === 0 ? 'bg-red-500' : 'bg-indigo-600';

                return (
                  <div key={card.id} className="relative bg-white p-3 rounded-xl shadow hover:shadow-lg transition-transform flex flex-col">
                    <div className={`absolute top-1 left-1 ${badgeColor} text-white text-[10px] px-2 py-[1px] rounded-full font-semibold shadow-md`}>
                      {ownedCount}/{possibleSubTypes.length}
                    </div>
                    <img
                      src={card.images?.small}
                      onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                      alt={card.name}
                      className="w-full h-40 object-contain mb-2"
                    />
                    <h2 className="text-sm font-medium text-indigo-600">{card.name}</h2>
                    <p className="text-xs text-gray-500 mb-2">
                      {card.set?.name} — {card.number}
                    </p>

                    {/* Owned SubType Buttons */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {possibleSubTypes.map((subType) => {
                        const normalized = normalizeSubType(subType);
                        const hasIt = ownedSet.has(normalized);
                        return (
                          <button
                            key={subType}
                            className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2
                              ${subTypeColorClass(subType)}
                              ${hasIt ? 'border-green-500 hover:border-red-500 hover:bg-red-500 cursor-pointer group' : 'border-gray-300 hover:border-green-500 cursor-pointer group'}
                              transition duration-200
                            `}
                            onClick={async () => {
                              if (!user) {
                                setShowLoginPrompt(true);
                                setTimeout(() => setShowLoginPrompt(false), 3000);
                              } else {
                                await addToCollection(card, subType);
                              }
                            }}
                            tabIndex={0}
                            aria-label={`${userFriendlySubTypeName(subType)} variant ${hasIt ? 'owned, click to remove' : 'not owned, click to add'}`}
                          >
                            {/* Show trash icon only on hover for owned subtypes */}
                            {hasIt && (
                              <Trash2 className="absolute hidden group-hover:flex text-white" size={16} />
                            )}
                            {/* Show + sign only on hover for unowned subtypes */}
                            {!hasIt && (
                              <span className="absolute inset-0 flex items-center justify-center text-white text-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity select-none pointer-events-none">+</span>
                            )}
                            {/* Tooltip */}
                            <span className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity transform bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap z-20 pointer-events-none">
                              {userFriendlySubTypeName(subType)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {showLoginPrompt && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 transition-opacity duration-500">
          Please sign in to add cards to your collection.
        </div>
      )}
    </div>
  );
};

export default Search;