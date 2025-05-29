import React, { useEffect, useState } from 'react';

const Collection = () => {
  const [collection, setCollection] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('collection')) || [];
    setCollection(saved);
  }, []);

  const removeCard = (id) => {
    const updated = collection.filter((card) => card.id !== id);
    setCollection(updated);
    localStorage.setItem('collection', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-700 mb-6">My Collection</h1>

        {collection.length === 0 ? (
          <p className="text-gray-500">You haven’t added any cards yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
                <p className="text-sm text-gray-500">{card.set.name} — {card.rarity}</p>
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
      </div>
    </div>
  );
};

export default Collection;