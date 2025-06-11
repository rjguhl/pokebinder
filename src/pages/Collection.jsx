import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection as firestoreCollection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
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
      const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCollection(cards);
    } catch (err) {
      console.error('Error loading collection:', err);
    }
  };

  const fetchMasterSets = async (uid) => {
    try {
      const snapshot = await getDocs(firestoreCollection(db, 'users', uid, 'mastersets'));
      const sets = snapshot.docs.map(doc => doc.data());
      setMasterSets(sets);
      // After setting, recalculate ownedCards if collection is available
      if (collection.length > 0) {
        const recalculated = sets.map(set => ({
          ...set,
          ownedCards: set.cardIds.filter(id => collection.some(c => c.cardId === id)).length,
        }));
        setMasterSets(recalculated);
      }
    } catch (err) {
      console.error('Failed to fetch master sets:', err);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!cardId) {
      console.error('Card ID is undefined — cannot delete');
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'collection', cardId));
      const updatedCollection = collection.filter((card) => card.id !== cardId);
      setCollection(updatedCollection);

      const updatedSets = await Promise.all(masterSets.map(async (set) => {
        if (set.cardIds && set.cardIds.includes(cardId)) {
          // Count ownedCards based on updatedCollection
          const updatedOwned = set.cardIds.filter(id => id !== cardId && updatedCollection.some(c => c.cardId === id)).length;
          const updatedSet = { ...set, ownedCards: updatedOwned };
          await updateDoc(doc(db, 'users', user.uid, 'mastersets', set.name), updatedSet);
          return updatedSet;
        }
        return set;
      }));
      setMasterSets(updatedSets);
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  };

  const handleDeleteMasterSet = async (name) => {
    const confirmed = window.confirm(`Are you sure you want to delete the master set "${name}"?`);
    if (!confirmed) return;
    const docId = name.toLowerCase().replace(/\s+/g, '-');
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'mastersets', docId));
      setMasterSets(masterSets.filter(set => set.name !== name));
    } catch (err) {
      console.error('Failed to delete master set:', err);
    }
  };  

  if (!user) {
    const sampleCards = [
      {
        id: 'base1-4',
        name: 'Charizard',
        images: { small: 'https://images.pokemontcg.io/base1/4.png' },
        set: { name: 'Base Set', total: 102 },
        number: '4',
      },
      {
        id: 'sm115-19',
        name: 'Eevee & Snorlax GX',
        images: { small: 'https://images.pokemontcg.io/sm115/19.png' },
        set: { name: 'SM Promo', total: 236 },
        number: '19',
      },
      {
        id: 'sm9-55',
        name: 'Pikachu',
        images: { small: 'https://images.pokemontcg.io/sm9/55.png' },
        set: { name: 'Team Up', total: 181 },
        number: '55',
      }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-indigo-700 mb-4">Login Required</h1>
          <p className="text-gray-600 mb-6">
            You must be signed in to view your collection.{' '}
            <a href="/login" className="text-indigo-600 underline">Log in now</a>.
          </p>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-indigo-600 mb-4">Collection Preview</h2>
            <p className="text-sm text-gray-500 mb-4">Here's what your collection will look like once you start adding cards:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-center">
              {sampleCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
                >
                  <img
                    src={card.images?.small || '/placeholder.png'}
                    alt={card.name}
                    className="w-full h-auto object-contain rounded"
                    />
                  <h2 className="text-sm font-medium text-indigo-600">{card.name}</h2>
                  <p className="text-xs text-gray-500">
                    {card.set.name} — {card.number}/{card.set.total}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-700 mb-6">Your Collection</h1>

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
                      ></div>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleDeleteMasterSet(set.name)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    title="Delete Master Set"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="my-8 border-gray-300" />
        <h2 className="text-2xl font-semibold text-indigo-700 mt-10 mb-4">Your Cards</h2>

        {collection.length === 0 ? (
          <p className="text-center text-gray-500">Your collection is empty. Start adding cards from the search page.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {(showAllCards ? collection : collection.slice(0, 10)).map((card) => (
                <div
                  key={card.cardId || card.id || Math.random()}
                  className="relative bg-white p-3 rounded-xl shadow hover:shadow-lg hover:scale-105 transition-transform"
                >
                  <img
                    src={
                      card.image ||
                      (card.cardId && card.cardId.includes('-') ?
                        `https://images.pokemontcg.io/${card.cardId.split('-')[0]}/${card.cardId.split('-')[1]}.png`
                        : '/placeholder.png')
                    }
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