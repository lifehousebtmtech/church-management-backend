import React, { useState, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import api from '../../services/api';

const UserSearch = ({ 
  onSelect, 
  excludeIds = [], 
  placeholder = "Search church users...",
  preSelectedUser = null,
  className = '',
  role = null
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(preSelectedUser);
  const searchTimeout = useRef(null);

  const searchChurchUsers = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Searching with query:', searchQuery); // Debug log
      const response = await api.churchUsers.search({ 
        query: searchQuery, 
        role,
        collection: 'churchUsers'
      });
      console.log('Search response:', response); // Debug log
      
      if (response && response.users) {
        const filteredResults = response.users.filter(user => 
          !excludeIds.includes(user._id)
        );
        console.log('Filtered results:', filteredResults); // Debug log
        setResults(filteredResults);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error searching church users:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [excludeIds, role]);

  const handleSearch = useCallback((value) => {
    setQuery(value);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    if (value.length >= 2) {
      searchTimeout.current = setTimeout(() => {
        searchChurchUsers(value);
      }, 300);
    } else {
      setResults([]);
    }
  }, [searchChurchUsers]);

  const handleSelect = (user) => {
    setSelectedUser(user);
    setQuery('');
    setResults([]);
    onSelect(user);
  };

  const handleRemove = () => {
    setSelectedUser(null);
    onSelect(null);
  };

  if (selectedUser) {
    return (
      <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-300">
        <span className="text-gray-900">{selectedUser.name}</span>
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
          {results.map((user) => (
            <button
              key={user._id}
              onClick={() => handleSelect(user)}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:outline-none"
            >
              <div className="text-sm font-medium text-gray-900">
                {user.name}
              </div>
              {user.email && (
                <div className="text-xs text-gray-500">{user.email}</div>
              )}
              {user.role && (
                <div className="text-xs text-blue-500 capitalize">{user.role}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearch;