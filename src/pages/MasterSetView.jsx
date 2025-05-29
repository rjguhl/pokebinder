import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const MasterSetView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [setData, setSetData] = useState(null);
  const [cardData, setCardData] = useState({});
  const [collection, setCollection] = useState(
    JSON.parse(localStorage.getItem('collection')) || []
  );

  useEffect(() => {
    const sets = JSON.parse(localStorage.getItem('masterSets')) || [];
    const found = sets.find((s) => s.id === id);
    if (!found) return navigate('/mastersets');
    setSetData(found);
  }, [id, navigate]);

  useEffect(() => {
    const fetchCards = async () => {
      if (!setData || !setData.allCardIds?.length) return;
      const uniqueIds = [...new Set(setData.allCardIds)];
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
        console.error('Failed to fetch cards:', err);
      }
    };

    fetchCards();
  }, [setData]);

  if (!setData) return null;

  const allCards = setData.allCardIds.map((id) => cardData[id]).filter(Boolean);
  const owned = new Set(setData.ownedCardIds);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-700 mb-4">{setData.name}</h1>
        <p className="text-gray-600 mb-6">
          {owned.size} / {setData.allCardIds.length} cards owned
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {allCards.map((card) => (
            <div
              key={card.id}
              className={`p-2 rounded-md text-center border shadow-sm transition ${
                owned.has(card.id)
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default MasterSetView;