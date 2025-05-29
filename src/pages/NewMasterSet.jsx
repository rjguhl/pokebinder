import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NewMasterSet = () => {
  const [name, setName] = useState('');
  const [searchType, setSearchType] = useState('pokemon'); // 'pokemon', 'set', 'other'
  const [options, setOptions] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [selected, setSelected] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setCollection(JSON.parse(localStorage.getItem('collection')) || []);
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      if (searchType === 'pokemon') {
        // Static list for simplicity or fetch from your own backend/cache
        setOptions(['Pikachu', 'Charizard', 'Slowpoke', 'Eevee', 'Bulbasaur', 'Snorlax']);
      } else if (searchType === 'set') {
        const res = await axios.get('https://api.pokemontcg.io/v2/sets');
        setOptions(res.data.data.map((set) => set.name));
      } else {
        setOptions([]); // future: support subtypes, artists, etc.
      }
    };
    fetchOptions();
  }, [searchType]);

  useEffect(() => {
    const filtered = options.filter((opt) =>
      opt.toLowerCase().includes(searchInput.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchInput, options]);

  const handleCreate = async () => {
    if (!name || !selected) return alert('Enter a name and make a selection.');

    let query = '';
    if (searchType === 'pokemon') query = `name:${selected}`;
    if (searchType === 'set') query = `set.name:"${selected}"`;

    setLoading(true);
    const res = await axios.get(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=250`, {
      headers: { 'X-Api-Key': import.meta.env.VITE_POKEMON_API_KEY }
    });

    const cards = res.data.data;
    const allCardIds = [...new Set(cards.map((c) => c.id))];
    const ownedCardIds = allCardIds.filter((id) => collection.some((c) => c.id === id));

    const newSet = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      query,
      sortMode: 'price',
      allCardIds,
      ownedCardIds,
    };

    const saved = JSON.parse(localStorage.getItem('masterSets')) || [];
    localStorage.setItem('masterSets', JSON.stringify([...saved, newSet]));
    navigate('/mastersets');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-indigo-700 mb-4">Create a Master Set</h1>

        <input
          type="text"
          placeholder="Name your Master Set"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-4 p-3 border rounded-md"
        />

        <div className="mb-4">
          <label className="block font-medium mb-1">What would you like to track?</label>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="pokemon">A Pokémon</option>
            <option value="set">A Set</option>
            <option value="other" disabled>Other (coming soon)</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block font-medium mb-1">
            {searchType === 'pokemon' ? 'Search for a Pokémon' : 'Search for a Set'}
          </label>
          <input
            type="text"
            placeholder={`Type to search ${searchType}s...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full p-2 border rounded-md mb-2"
          />
          <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-white">
            {filteredOptions.map((opt) => (
              <div
                key={opt}
                onClick={() => setSelected(opt)}
                className={`cursor-pointer px-2 py-1 rounded hover:bg-indigo-100 ${
                  selected === opt ? 'bg-indigo-200' : ''
                }`}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded font-semibold"
        >
          {loading ? 'Creating...' : 'Create Master Set'}
        </button>
      </div>
    </div>
  );
};

export default NewMasterSet;