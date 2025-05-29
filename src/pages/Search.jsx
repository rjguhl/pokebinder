import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [setFilter, setSetFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [supertypeFilter, setSupertypeFilter] = useState('');
  const [sortOption, setSortOption] = useState('price');

  const [collection, setCollection] = useState(
    JSON.parse(localStorage.getItem('collection')) || []
  );

  const observer = useRef();

  const queryString = () => {
    let q = `name:${query}`;
    if (setFilter) q += ` set.name:"${setFilter}"`;
    if (rarityFilter) q += ` rarity:"${rarityFilter}"`;
    if (supertypeFilter) q += ` supertype:"${supertypeFilter}"`;
    return q;
  };

  const fetchCards = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(queryString())}&page=${page}&pageSize=12`,
        {
          headers: {
            'X-Api-Key': import.meta.env.VITE_POKEMON_API_KEY,
          },
        }
      );

      const newCards = response.data?.data || [];

      const seen = new Set();
      let deduped = newCards.filter((card) => {
        if (seen.has(card.id)) return false;
        seen.add(card.id);
        return true;
      });

      if (sortOption === 'price') {
        deduped.sort((a, b) => {
          const priceA = a.cardmarket?.prices?.averageSellPrice || 0;
          const priceB = b.cardmarket?.prices?.averageSellPrice || 0;
          return priceB - priceA;
        });
      } else if (sortOption === 'set') {
        deduped.sort((a, b) => {
          const dateA = new Date(a.set.releaseDate || '1970-01-01');
          const dateB = new Date(b.set.releaseDate || '1970-01-01');
          return dateA - dateB;
        });
      } else if (sortOption === 'name') {
        deduped.sort((a, b) => a.name.localeCompare(b.name));
      }

      setResults((prev) => {
        const combined = [...prev, ...deduped];
        const unique = [];
        const seenFinal = new Set();
        for (let card of combined) {
          if (!seenFinal.has(card.id)) {
            seenFinal.add(card.id);
            unique.push(card);
          }
        }
        return unique;
      });

      setHasMore(deduped.length > 0);
    } catch (err) {
      console.error('Error fetching cards:', err);
    }
    setLoading(false);
  }, [query, page, setFilter, rarityFilter, supertypeFilter, sortOption]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setResults([]);
    setPage(1);
    fetchCards();
  };

  const handleApplyFilters = () => {
    setResults([]);
    setPage(1);
    setFiltersOpen(false);
    fetchCards();
  };

  const addToCollection = (card) => {
    if (collection.find((c) => c.id === card.id)) return;
    const updated = [...collection, card];
    setCollection(updated);
    localStorage.setItem('collection', JSON.stringify(updated));
  };

  const lastCardRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-700 mb-6">Search Cards</h1>

        {/* Search + Filter + Sort Controls */}
        <form onSubmit={handleSearch} className="flex gap-4 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Search Pokémon cards..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold shadow-md"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className="bg-gray-100 border border-gray-300 text-sm px-4 py-2 rounded-md hover:bg-gray-200"
          >
            {filtersOpen ? 'Hide Filters' : 'Filters'}
          </button>

          <select
            value={sortOption}
            onChange={(e) => {
              setSortOption(e.target.value);
              setResults([]);
              setPage(1);
            }}
            className="border border-gray-300 rounded-md p-2 text-sm"
          >
            <option value="price">Sort by Price</option>
            <option value="set">Sort by Set Release</option>
            <option value="name">Sort A → Z</option>
          </select>
        </form>

        {filtersOpen && (
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              value={setFilter}
              onChange={(e) => setSetFilter(e.target.value)}
              className="border border-gray-300 rounded-md p-2"
            >
              <option value="">All Sets</option>
              <option value="Base">Base</option>
              <option value="Team Up">Team Up</option>
              <option value="Sword & Shield">Sword & Shield</option>
              <option value="Scarlet & Violet">Scarlet & Violet</option>
            </select>

            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="border border-gray-300 rounded-md p-2"
            >
              <option value="">All Rarities</option>
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Rare Holo">Rare Holo</option>
              <option value="Ultra Rare">Ultra Rare</option>
              <option value="Secret Rare">Secret Rare</option>
            </select>

            <select
              value={supertypeFilter}
              onChange={(e) => setSupertypeFilter(e.target.value)}
              className="border border-gray-300 rounded-md p-2"
            >
              <option value="">All Types</option>
              <option value="Pokémon">Pokémon</option>
              <option value="Trainer">Trainer</option>
              <option value="Energy">Energy</option>
            </select>

            <button
              onClick={handleApplyFilters}
              className="col-span-full sm:col-span-1 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
            >
              Apply Filters
            </button>
          </div>
        )}

        {/* Card Results */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {results.map((card, index) => {
            const isLast = index === results.length - 1;
            return (
              <div
                key={card.id}
                ref={isLast ? lastCardRef : null}
                className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
              >
                <img
                  src={card.images.small}
                  alt={card.name}
                  className="w-full h-48 object-contain mb-3"
                />
                <h2 className="text-lg font-semibold text-indigo-600">{card.name}</h2>
                <p className="text-sm text-gray-500">
                  {card.set.name} — {card.number}/{card.set.total}
                </p>
                <button
                  onClick={() => addToCollection(card)}
                  className="mt-3 w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-md font-medium"
                >
                  Add to Collection
                </button>
              </div>
            );
          })}
        </div>

        {loading && <p className="text-center text-gray-500 mt-4">Loading more cards...</p>}
      </div>
    </div>
  );
};

export default Search;