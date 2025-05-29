import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MasterSets = () => {
  const [masterSets, setMasterSets] = useState([]);
  const [cardData, setCardData] = useState({});
  const [collection, setCollection] = useState(
    JSON.parse(localStorage.getItem('collection')) || []
  );
  const navigate = useNavigate();

  useEffect(() => {
    const sets = JSON.parse(localStorage.getItem('masterSets')) || [];
    setMasterSets(sets);

    const fetchCards = async () => {
      const allIds = sets.flatMap((set) => set.allCardIds || []);
      const uniqueIds = [...new Set(allIds)];
      const chunks = [];
      while (uniqueIds.length) chunks.push(uniqueIds.splice(0, 250));

      try {
        const responses = await Promise.all(
          chunks.map((chunk) =>
            axios.get('https://api.pokemontcg.io/v2/cards', {
              params: { ids: chunk.join(',') },
              headers: {
                'X-Api-Key': import.meta.env.VITE_POKEMON_API_KEY,
              },
            })
          )
        );

        const allCards = responses.flatMap((res) => res.data.data);
        const cardMap = {};
        allCards.forEach((card) => {
          cardMap[card.id] = card;
        });
        setCardData(cardMap);
      } catch (err) {
        console.error('Failed to fetch master set cards:', err);
      }
    };

    if (sets.length) fetchCards();
  }, []);

  const getCardsForSet = (set) => {
    if (!set.allCardIds || !cardData) return [];
    return set.allCardIds.map((id) => cardData[id]).filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-indigo-700">Master Sets</h1>
          <button
            onClick={() => navigate('/mastersets/new')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium shadow-md"
          >
            + Create Master Set
          </button>
        </div>

        {masterSets.length === 0 ? (
          <p className="text-gray-500">You have not created any master sets yet.</p>
        ) : (
          masterSets.map((set) => {
            const owned = set.ownedCardIds || [];
            const allCards = getCardsForSet(set);
            return (
              <div
                key={set.id}
                className="mb-10 bg-white rounded-xl shadow p-6 border border-gray-200"
              >
                <h2 className="text-2xl font-bold text-indigo-600 mb-2 cursor-pointer hover:underline" onClick={() => navigate(`/mastersets/${set.id}`)}>
                  {set.name}
                </h2>
                <p className="text-gray-600 mb-4">
                  {owned.length} / {set.allCardIds?.length || 0} cards owned
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {allCards.map((card) => {
                    const isOwned = owned.includes(card.id);
                    return (
                      <div
                        key={card.id}
                        className={`p-2 rounded-md text-center border shadow-sm transition ${
                          isOwned
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 bg-gray-100 opacity-50'
                        }`}
                      >
                        <img
                          src={card.images.small}
                          alt={card.name}
                          className="w-full h-32 object-contain mb-1"
                        />
                        <p className="text-xs font-medium text-gray-700">
                          {card.name} ({card.number}/{card.set.total})
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MasterSets;