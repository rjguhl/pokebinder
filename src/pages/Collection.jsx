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

  const handleDeleteCard = async (cardId) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'collection', cardId));
      setCollection((prev) => prev.filter((c) => c.id !== cardId));
    } catch (err) {
      console.error('Failed to delete card:', err);
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {(showAllCards ? collection : collection.slice(0, 10)).map((card) => (
                <div key={card.id} className="relative bg-white p-3 rounded-xl shadow hover:shadow-lg transition-transform">
                  <div className="absolute top-1 left-1 bg-indigo-600 text-white text-[10px] px-2 py-[1px] rounded-full font-semibold shadow-md">
                    {card.ownedFinishes.length}/{card.totalFinishes}
                  </div>
                  <img
                    src={card.image || '/placeholder.png'}
                    alt={card.name}
                    className="w-full h-40 object-contain mb-2"
                  />
                  <h2 className="text-sm font-medium text-indigo-600">{card.name}</h2>
                  <p className="text-xs text-gray-500">
                    {card.set} — {card.number}
                  </p>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
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