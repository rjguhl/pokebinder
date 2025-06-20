import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection as firestoreCollection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { Trash2, Plus } from 'react-feather';

const finishColors = {
  normal: { bg: 'bg-blue-100', text: 'text-blue-800' },
  holofoil: { bg: 'bg-purple-100', text: 'text-purple-800' },
  reverseHolofoil: { bg: 'bg-pink-100', text: 'text-pink-800' },
  fullArt: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  // Add more finishes as needed
};

const getFinishColor = (finish) => {
  return finishColors[finish] || { bg: 'bg-gray-100', text: 'text-gray-800' };
};

const Collection = () => {
  const [collection, setCollection] = useState([]);
  const [user, setUser] = useState(null);
  const [masterSets, setMasterSets] = useState([]);
  const [showAllCards, setShowAllCards] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadUserCollection(currentUser.uid);
        fetchMasterSets(currentUser.uid);
      } else {
        setUser(null);
        setCollection([]);
        setMasterSets([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserCollection = async (uid) => {
    try {
      const snapshot = await getDocs(firestoreCollection(db, 'users', uid, 'collection'));
      const cardMap = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const baseId = data.baseId || data.cardId?.split('-').slice(0, 2).join('-');
        if (!baseId) return;

        if (!cardMap[baseId]) {
          cardMap[baseId] = {
            id: baseId,
            name: data.name,
            image: data.image,
            set: data.set,
            number: data.number,
            rarity: data.rarity,
            ownedFinishes: new Set(),
            totalFinishes: (data.rarity === 'Common' || data.rarity === 'Uncommon') ? 2 : 1,
          };
        }

        cardMap[baseId].ownedFinishes.add(data.finish || 'normal');
      });

      const mergedCards = Object.values(cardMap).map(card => ({
        ...card,
        ownedFinishes: Array.from(card.ownedFinishes),
      }));

      setCollection(mergedCards);
    } catch (err) {
      console.error('Error loading collection:', err);
    }
  };

  const fetchMasterSets = async (uid) => {
    try {
      const snapshot = await getDocs(firestoreCollection(db, 'users', uid, 'mastersets'));
      const sets = snapshot.docs.map(doc => doc.data());
      setMasterSets(sets);
    } catch (err) {
      console.error('Failed to fetch master sets:', err);
    }
  };

  const handleDeleteFinish = async (cardId, finish) => {
    if (!user) return;
    try {
      // Find the specific doc for this card finish
      const collectionRef = firestoreCollection(db, 'users', user.uid, 'collection');
      const snapshot = await getDocs(collectionRef);
      let docIdToDelete = null;
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const baseId = data.baseId || data.cardId?.split('-').slice(0, 2).join('-');
        const cardFinish = data.finish || 'normal';
        if (baseId === cardId && cardFinish.toLowerCase() === finish.toLowerCase()) {
          docIdToDelete = docSnap.id;
        }
      });
      if (docIdToDelete) {
        await deleteDoc(doc(db, 'users', user.uid, 'collection', docIdToDelete));
        setCollection((prev) =>
          prev.map((c) => {
            if (c.id === cardId) {
              const newFinishes = c.ownedFinishes.filter((f) => f !== finish);
              return { ...c, ownedFinishes: newFinishes };
            }
            return c;
          }).filter(c => c.ownedFinishes.length > 0)
        );
      }
    } catch (err) {
      console.error('Failed to delete card finish:', err);
    }
  };

  const handleDeleteMasterSet = async (name) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${name}"?`);
    if (!confirmed) return;
    const docId = name.toLowerCase().replace(/\s+/g, '-');
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'mastersets', docId));
      setMasterSets((prev) => prev.filter((s) => s.name !== name));
    } catch (err) {
      console.error('Failed to delete master set:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-700 mb-6">Your Collection</h1>

        {/* Master Sets */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-indigo-700">Your Master Sets</h2>
            <Link to="/masterset" className="text-indigo-600 hover:text-indigo-800">
              <Plus size={24} />
            </Link>
          </div>
          {masterSets.length === 0 ? (
            <p className="text-gray-500 mb-6">You have no Master Sets yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {masterSets.map((set) => (
                <div key={set.name} className="relative bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition">
                  <Link to={`/mastersets/${set.name}/view`} className="block">
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={`https://images.pokemontcg.io/${set.cardIds?.[0]?.split('-')[0]}/${set.cardIds?.[0]?.split('-')[1]}.png`}
                        alt={set.name}
                        className="w-12 h-16 object-contain rounded border"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-indigo-600 capitalize">{set.name}</h3>
                        <p className="text-sm text-gray-600">
                          {set.ownedCards} of {set.totalCards} cards owned
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded">
                      <div
                        className="bg-green-500 h-3 rounded"
                        style={{ width: `${(set.ownedCards / set.totalCards) * 100}%` }}
                      />
                    </div>
                  </Link>
                  <button
                    onClick={() => handleDeleteMasterSet(set.name)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cards */}
        <hr className="my-8 border-gray-300" />
        <h2 className="text-2xl font-semibold text-indigo-700 mt-10 mb-4">Your Cards</h2>

        {collection.length === 0 ? (
          <p className="text-center text-gray-500">
            Your collection is empty. Start adding cards from the search page.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-6 justify-center">
              {(showAllCards ? collection : collection.slice(0, 10)).map((card) => (
                <div
                  key={card.id}
                  className="flex flex-col items-center bg-white rounded-xl shadow-md hover:shadow-lg transition-transform transform hover:scale-105 w-40 p-4 relative"
                >
                  <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold shadow-md z-10">
                    {card.ownedFinishes.length}/{card.totalFinishes}
                  </div>
                  <img
                    src={card.image || '/placeholder.png'}
                    alt={card.name}
                    className="w-full h-48 object-contain mb-3 rounded"
                  />
                  <h2 className="text-sm font-semibold text-indigo-600 text-center">{card.name}</h2>
                  <p className="text-xs text-gray-500 mb-3 text-center">
                    {(typeof card.set === 'string' ? card.set : card.set?.name) || 'Unknown'} — {card.number}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {card.ownedFinishes.map((finish) => {
                      const { bg, text } = getFinishColor(finish);
                      return (
                        <button
                          key={finish}
                          onClick={() => handleDeleteFinish(card.id, finish)}
                          className={`group w-8 h-8 flex items-center justify-center rounded-full border-2 ${bg} ${text} transition duration-200 hover:scale-105 cursor-pointer select-none relative hover:bg-red-500`}
                          type="button"
                          title={finish.charAt(0).toUpperCase() + finish.slice(1)}
                        >
                          <div className="flex items-center justify-center">
                            <Trash2 className="hidden group-hover:flex text-white" size={16} />
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-5 h-5 group-hover:hidden"
                              aria-hidden="true"
                            >
                              <circle cx="10" cy="10" r="9" className={bg} />
                              <path
                                d="M7.5 10.5l2 2 3-3"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          {/* Tooltip */}
                          <span className="absolute z-20 left-1/2 -translate-x-1/2 bottom-10 whitespace-nowrap text-xs rounded bg-gray-800 text-white px-2 py-1 opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100">
                            {finish.charAt(0).toUpperCase() + finish.slice(1)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {collection.length > 10 && !showAllCards && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setShowAllCards(true)}
                  className="text-indigo-600 hover:underline"
                >
                  Show More Cards
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Collection;