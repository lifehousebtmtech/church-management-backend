// frontend/src/pages/Users/create.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import PersonSearch from '../../components/PersonSearch';
import api from '../../services/api';

const CreateUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    person: null,
    username: '',
    password: '',
    role: 'user'
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handlePersonSelect = (person) => {
    if (person) {
      if (!person.phone) {  // This is correct as it matches your database field
        setErrors(prev => ({
          ...prev,
          person: 'Selected person must have a phone number'
        }));
        return;
      }
      setFormData(prev => ({
        ...prev,
        person: person._id,
        username: person.phone  // This is correct as it matches your database field
      }));
      setErrors(prev => ({
        ...prev,
        person: undefined,
        username: undefined
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        person: null,
        username: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.person) newErrors.person = 'Person is required';
    if (!formData.username) newErrors.username = 'Username (phone number) is required';
    if (!formData.password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      await api.users.create(formData);
      navigate('/users');
    } catch (error) {
      setErrors({ submit: error.message });
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Create User</h1>
          <button onClick={() => navigate('/users')} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Person</label>
            <PersonSearch
              onSelect={handlePersonSelect}
              placeholder="Search for person..."
            />
            {errors.person && (
              <p className="mt-1 text-sm text-red-500">{errors.person}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Username (Phone Number)</label>
            <input
              type="text"
              value={formData.username}
              readOnly
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Will be auto-filled from person's phone number"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {errors.submit && (
            <div className="text-red-500 text-sm">{errors.submit}</div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;