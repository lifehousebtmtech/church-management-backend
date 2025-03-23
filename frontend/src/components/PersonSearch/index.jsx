import React, { useState, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import api from '../../services/api';

const PersonSearch = ({ 
  onSelect, 
  excludeIds = [], 
  placeholder = "Search people...",
  preSelectedPerson = null,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(preSelectedPerson);
  const searchTimeout = useRef(null);

  const searchPeople = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.people.search(searchQuery);
      console.log('Search response:', response); // Debug log

      if (response && response.people) {
        const filteredResults = response.people.filter(person => 
          !excludeIds.includes(person._id)
        );
        setResults(filteredResults);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error searching people:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [excludeIds]);

  const handleSearch = useCallback((value) => {
    setQuery(value);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    // Only search if there's at least 2 characters
    if (value.length >= 2) {
      searchTimeout.current = setTimeout(() => {
        searchPeople(value);
      }, 300);
    } else {
      setResults([]);
    }
  }, [searchPeople]);

  const handleSelect = (person) => {
    setSelectedPerson(person);
    setQuery('');
    setResults([]);
    onSelect(person);
  };

  const handleRemove = () => {
    setSelectedPerson(null);
    onSelect(null);
  };

  if (selectedPerson) {
    return (
      <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-300">
        <span className="text-gray-900">{selectedPerson.firstName} {selectedPerson.lastName}</span>
        <button
          onClick={handleRemove}
          className="text-gray-400 hover:text-red-500"
          type="button"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {loading && (
        <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg border p-2 z-10">
          Loading...
        </div>
      )}

      {results.length > 0 && (
        <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg border max-h-60 overflow-y-auto z-10">
          {results.map((person) => (
            <button
              key={person._id}
              onClick={() => handleSelect(person)}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:outline-none"
            >
              <div className="text-sm font-medium text-gray-900">
                {person.firstName} {person.lastName}
              </div>
              {person.email && (
                <div className="text-xs text-gray-500">{person.email}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PersonSearch;