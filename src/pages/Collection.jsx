import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Collection = () => {
  const [collection, setCollection] = useState([]);
  const [masterSets, setMasterSets] = useState([]);

  useEffect(() => {
    const savedCollection = JSON.parse(localStorage.getItem('collection')) || [];
    const savedSets = JSON.parse(localStorage.getItem('masterSets')) || [];
    setCollection(savedCollection);
    setMasterSets(savedSets);
  }, []);

  const removeCard = (id) => {
    const updatedCollection = collection.filter((card) => card.id !== id);
    setCollection(updatedCollection);
    localStorage.setItem('collection', JSON.stringify(updatedCollection));

    const updatedSets = masterSets
      .map((set) => {
        const newOwned = set.ownedCardIds?.filter((ownedId) => ownedId !== id) || [];
        return newOwned.length > 0 ? { ...set, ownedCardIds: newOwned } : null;
      })
      .filter(Boolean);

    setMasterSets(updatedSets);
    localStorage.setItem('masterSets', JSON.stringify(updatedSets));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-700 mb-6">My Collection</h1>

        {collection.length === 0 ? (
          <p className="text-gray-500 mb-8">You haven’t added any cards yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
            {collection.map((card) => (
              <div
                key={card.id}
                className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
              >
                <img
                  src={card.images.small}
                  alt={card.name}
                  className="w-full h-48 object-contain mb-3"
                />
                <h2 className="text-lg font-semibold text-indigo-600">{card.name}</h2>
                <p className="text-sm text-gray-500">{card.set.name} — {card.number}/{card.set.total}</p>
                <button
                  onClick={() => removeCard(card.id)}
                  className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Master Sets Preview Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Your Master Sets</h2>
          <Link
            to="/mastersets"
            className="text-indigo-600 text-sm hover:underline font-medium"
          >
            View All →
          </Link>
        </div>

        {masterSets.length === 0 ? (
          <p className="text-gray-500 mb-4">No Master Sets yet. Start one from your collection!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {masterSets.slice(0, 3).map((set) => (
              <Link
                key={set.id}
                to="/mastersets"
                className="block bg-white border border-gray-200 hover:border-indigo-500 p-4 rounded-xl shadow-sm transition"
              >
                <h3 className="text-lg font-semibold text-indigo-700 mb-1">{set.name}</h3>
                <p className="text-sm text-gray-500">
                  Cards Owned: {set.ownedCardIds?.length || 0} / {set.allCardIds?.length || 0}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Collection;