import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { db, auth } from '../firebase';
import { doc, getDoc, getDocs, collection as fsCollection } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const MasterSetView = () => {
  const { id } = useParams();
  const [cards, setCards] = useState([]);
  const [userCollection, setUserCollection] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;
      try {
        const collectionSnap = await getDoc(doc(db, 'users', currentUser.uid, 'mastersets', id));
        if (collectionSnap.exists()) {
          const masterSet = collectionSnap.data();
          const cardIds = (masterSet.cardIds || []).filter((id) => typeof id === 'string');
          console.log('Card IDs to fetch:', cardIds);

          if (!cardIds.length) {
            console.warn('No valid card IDs found in the master set.');
          }

          // Fetch user collection IDs
          const userColSnap = await getDocs(fsCollection(db, 'users', currentUser.uid, 'collection'));
          const ownedCards = userColSnap.docs.map(doc => doc.id);
          setUserCollection(ownedCards);

          // Chunk card IDs into batches of 250 to avoid API limits
          const chunkSize = 250;
          const cardChunks = [];
          for (let i = 0; i < cardIds.length; i += chunkSize) {
            cardChunks.push(cardIds.slice(i, i + chunkSize));
          }

          const fetchedCards = [];
          for (const chunk of cardChunks) {
            const baseIds = chunk.map(id => id.split('-').slice(0, 2).join('-'));
            const response = await axios.get('https://api.pokemontcg.io/v2/cards', {
              params: { ids: [...new Set(baseIds)].join(',') },
              headers: { 'X-Api-Key': import.meta.env.VITE_POKEMON_API_KEY }
            });
            fetchedCards.push(...response.data.data);
          }

          console.log('Fetched cards:', fetchedCards);
          // Map user-saved variant IDs to base cards, reconstructing variant objects
          const finalCards = cardIds.map(savedId => {
            const parts = savedId.split('-');
            const baseId = parts.length >= 2 ? parts.slice(0, 2).join('-') : parts[0];
            const baseCard = fetchedCards.find(c => c.id === baseId);
            return baseCard
              ? {
                  ...baseCard,
                  id: savedId,
                  images: baseCard.images,
                  name: baseCard.name,
                  number: baseCard.number,
                  set: baseCard.set,
                }
              : null;
          }).filter(Boolean);

          setCards(finalCards);
        }
      } catch (err) {
        console.error('Failed to load master set:', err);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const cardsPerPage = 18;
  const paginatedCards = cards.slice(currentPage * cardsPerPage, (currentPage + 1) * cardsPerPage);
  const totalPages = Math.ceil(cards.length / cardsPerPage);

  if (loading) {
    return <div className="text-center text-gray-500 mt-10">Loading cards...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-indigo-700 mb-6 capitalize">Viewing: {id.replace(/-/g, ' ')}</h1>

        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col md:flex-row justify-center gap-6 w-full max-w-5xl">
            {[0, 9].map((offset) => (
              <div
                key={offset}
                className="bg-black p-4 rounded-2xl grid grid-cols-3 gap-4 w-full max-w-md"
              >
                {Array.from({ length: 9 }, (_, i) => {
                  const card = paginatedCards[i + offset];
                  const owned = card && userCollection.includes(card.id);
                  return (
                    <div
                      key={i + offset}
                      className={`aspect-[5/7] bg-gray-800 rounded-lg flex items-center justify-center ${
                        card ? (owned ? '' : 'opacity-50') : 'opacity-20'
                      }`}
                    >
                      {card && (
                        <img
                          src={card.images.small}
                          alt={card.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center w-full max-w-md">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
            >
              Previous
            </button>
            <p className="text-sm text-gray-600">
              Page {currentPage + 1} of {totalPages}
            </p>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterSetView;
