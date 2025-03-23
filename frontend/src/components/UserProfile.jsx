import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Settings, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserProfile = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
      >
        {user?.profile_picture ? (
          <img 
            src={user.profile_picture} 
            alt={user?.name || 'User'}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
            {user?.name ? getInitials(user.name) : <UserCircle className="h-6 w-6" />}
          </div>
        )}
        <span className="hidden md:block text-sm font-medium">{user?.name || 'User'}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-sm text-gray-500">{user?.email || ''}</p>
            </div>
            
            <Link 
              to="/settings" 
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </div>
            </Link>
            
            <Link 
              to="/logout" 
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;