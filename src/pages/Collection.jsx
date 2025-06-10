// File: Collection.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection as firestoreCollection, getDocs } from 'firebase/firestore';

const Collection = () => {
  const [collection, setCollection] = useState([]);
  const [user, setUser] = useState(localStorage.getItem('user'));
  const [masterSets, setMasterSets] = useState([]);

  useEffect(() => {
    if (user) {
      const saved = JSON.parse(localStorage.getItem('collection')) || [];
      setCollection(saved);
      fetchMasterSets();
    }
  }, [user]);

  const fetchMasterSets = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const snapshot = await getDocs(firestoreCollection(db, 'users', uid, 'mastersets'));
      const sets = snapshot.docs.map(doc => doc.data());
      setMasterSets(sets);
    } catch (err) {
      console.error('Failed to fetch master sets:', err);
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
                    src={card.images.small}
                    alt={card.name}
                    className="w-full h-40 object-contain mb-2"
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

        {collection.length === 0 ? (
          <p className="text-center text-gray-500">Your collection is empty. Start adding cards from the search page.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {collection.map((card) => (
              <div
                key={card.id}
                className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
              >
                <img
                  src={card.images.small}
                  alt={card.name}
                  className="w-full h-40 object-contain mb-2"
                />
                <h2 className="text-sm font-medium text-indigo-600">{card.name}</h2>
                <p className="text-xs text-gray-500">
                  {card.set.name} — {card.number}/{card.set.total}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Master Set Builder Section */}
        <div className="mt-10 bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold text-indigo-600 mb-4">Master Set Builder</h2>
          <p className="text-gray-600 mb-4">
            Create your own Master Set by searching for a specific Pokémon. We’ll generate a list of all its cards.
          </p>
          <Link
            to="/masterset"
            className="inline-block bg-indigo-600 text-white px-5 py-3 rounded-lg shadow hover:bg-indigo-700 font-medium"
          >
            Build a Master Set
          </Link>
        </div>

        {/* Saved Master Sets */}
        {masterSets.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Your Master Sets</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {masterSets.map((set) => (
                <div key={set.name} className="bg-white p-4 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold text-indigo-600 mb-2 capitalize">{set.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {set.ownedCards} of {set.totalCards} cards owned
                  </p>
                  <div className="w-full bg-gray-200 h-3 rounded">
                    <div
                      className="bg-green-500 h-3 rounded"
                      style={{ width: `${(set.ownedCards / set.totalCards) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collection;