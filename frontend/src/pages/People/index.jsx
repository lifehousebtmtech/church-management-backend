import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Edit, Trash2, Users, Eye, X, Upload, Mail, Phone, Calendar, Home, FilterX, Check } from 'lucide-react';
import api from '../../services/api';

const PeoplePage = () => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    gender: '',
    hasEmail: '',
    hasPhone: '',
    hasHousehold: ''
  });
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    profileImage: null
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'firstName', direction: 'asc' });

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      setLoading(true);
      const response = await api.people.getAll();
      const peopleData = Array.isArray(response.people) ? response.people : Array.isArray(response) ? response : [];
      
      // Sort initially by firstName
      const sortedPeople = sortPeople(peopleData, sortConfig);
      setPeople(sortedPeople);
    } catch (error) {
      console.error('Error loading people:', error);
      setPeople([]);
    } finally {
      setLoading(false);
    }
  };

  const sortPeople = (peopleArray, config) => {
    return [...peopleArray].sort((a, b) => {
      let aValue = config.key.includes('.') ? 
        config.key.split('.').reduce((obj, key) => obj?.[key], a) : 
        a[config.key];
      let bValue = config.key.includes('.') ? 
        config.key.split('.').reduce((obj, key) => obj?.[key], b) : 
        b[config.key];

      // Handle null/undefined values
      aValue = aValue ?? '';
      bValue = bValue ?? '';

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return config.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));

    setPeople(prevPeople => sortPeople(prevPeople, {
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this person?')) return;
    try {
      await api.people.delete(id);
      await loadPeople();
    } catch (error) {
      console.error('Error deleting person:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.gender?.trim()) newErrors.gender = 'Gender is required';
    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Invalid email format';
    }
    
    console.log('Form validation:', { formData, errors: newErrors });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    try {
      setSaving(true);
      const formDataToSend = new FormData();
      
      // Always add the required fields
      formDataToSend.append('firstName', formData.firstName.trim());
      formDataToSend.append('lastName', formData.lastName.trim());
      formDataToSend.append('gender', formData.gender);
      
      // Add optional fields
      if (formData.dateOfBirth) {
        formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      }
      if (formData.phone) {
        formDataToSend.append('phone', formData.phone.trim());
      }
      if (formData.email) {
        formDataToSend.append('email', formData.email.trim());
      }
      
      // Add profile image if it exists and is new
      if (formData.profileImage instanceof File) {
        formDataToSend.append('profileImage', formData.profileImage);
      }
  
      if (selectedPerson) {
        await api.people.update(selectedPerson._id, formDataToSend);
      } else {
        await api.people.create(formDataToSend);
      }
  
      await loadPeople();
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      console.error('Submit error:', error);
      setErrors({ submit: error.message });
    } finally {
      setSaving(false);
    }
  };
  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  };
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profileImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      email: '',
      profileImage: null
    });
    setImagePreview(null);
    setErrors({});
    setSelectedPerson(null);
  };

  const clearFilters = () => {
    setFilters({
      gender: '',
      hasEmail: '',
      hasPhone: '',
      hasHousehold: ''
    });
    setSearch('');
  };

  // Filter people based on search and filters
  const filteredPeople = people.filter(person => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      person.firstName.toLowerCase().includes(searchLower) ||
      person.lastName.toLowerCase().includes(searchLower) ||
      person.email?.toLowerCase().includes(searchLower) ||
      person.phone?.toLowerCase().includes(searchLower);

    const matchesGender = !filters.gender || person.gender === filters.gender;
    const matchesEmail = !filters.hasEmail || 
      (filters.hasEmail === 'yes' ? Boolean(person.email) : !person.email);
    const matchesPhone = !filters.hasPhone || 
      (filters.hasPhone === 'yes' ? Boolean(person.phone) : !person.phone);
    const matchesHousehold = !filters.hasHousehold || 
      (filters.hasHousehold === 'yes' ? Boolean(person.householdId) : !person.householdId);

    return matchesSearch && matchesGender && matchesEmail && matchesPhone && matchesHousehold;
  });

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const renderSortableHeader = (key, label) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(key)}
    >
      <div className="flex items-center gap-2">
        {label}
        <span className="text-gray-400">{getSortIcon(key)}</span>
      </div>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-semibold text-gray-900">People</h1>
          <span className="text-sm text-gray-500">({filteredPeople.length} total)</span>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <UserPlus size={20} />
          Add Person
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.gender}
              onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <select
              value={filters.hasEmail}
              onChange={(e) => setFilters(prev => ({ ...prev, hasEmail: e.target.value }))}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Email Status</option>
              <option value="yes">Has Email</option>
              <option value="no">No Email</option>
            </select>

            <select
              value={filters.hasPhone}
              onChange={(e) => setFilters(prev => ({ ...prev, hasPhone: e.target.value }))}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Phone Status</option>
              <option value="yes">Has Phone</option>
              <option value="no">No Phone</option>
            </select>

            <select
              value={filters.hasHousehold}
              onChange={(e) => setFilters(prev => ({ ...prev, hasHousehold: e.target.value }))}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Household Status</option>
              <option value="yes">In Household</option>
              <option value="no">No Household</option>
            </select>

            {(filters.gender || filters.hasEmail || filters.hasPhone || filters.hasHousehold || search) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                <FilterX size={20} />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* People List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : filteredPeople.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No people found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {renderSortableHeader('firstName', 'Name')}
                  {renderSortableHeader('gender', 'Gender')}
                  {renderSortableHeader('email', 'Email')}
                  {renderSortableHeader('phone', 'Phone')}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPeople.map((person) => (
                  <tr key={person._id} className="hover:bg-gray-50">
                   <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {person.profileImage ? (
                            <img 
                              src={`/api/people/${person._id}/image`}
                              alt={`${person.firstName} ${person.lastName}`}
                              className="w-8 h-8 rounded-full object-cover mr-3"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${person.firstName}+${person.lastName}&size=32`;
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                              {person.firstName[0]}{person.lastName[0]}
                            </div>
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {person.firstName} {person.lastName}
                          </div>
                        </div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 capitalize">{person.gender}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{person.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{person.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPerson(person);
                            setIsDetailsOpen(true);
                          }}
                          className="text-gray-600 hover:text-gray-800"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPerson(person);
                            setFormData({
                              firstName: person.firstName,
                              lastName: person.lastName,
                              dateOfBirth: person.dateOfBirth ? new Date(person.dateOfBirth).toISOString().split('T')[0] : '',
                              gender: person.gender,
                              phone: person.phone || '',
                              email: person.email || ''
                            });
                            setIsFormOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit Person"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(person._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Person"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Person Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {selectedPerson ? 'Edit Person' : 'Add New Person'}
                </h2>
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
               {/* Profile Image Upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                  {imagePreview ? (
                      <img 
                        src={imagePreview}
                        alt="Profile Preview"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : selectedPerson?.profileImage?.data ? (
                      <img 
                        src={`data:${selectedPerson.profileImage.contentType};base64,${arrayBufferToBase64(selectedPerson.profileImage.data)}`}
                        alt={`${selectedPerson.firstName} ${selectedPerson.lastName}`}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-xl">
                          {formData.firstName[0]}{formData.lastName[0]}
                        </span>
                      </div>
                    )}
                    <label 
                      htmlFor="profile-image" 
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700"
                    >
                      <Upload size={16} />
                    </label>
                    <input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={`mt-1 block w-full rounded-md border ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className={`mt-1 block w-full rounded-md border ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className={`mt-1 block w-full rounded-md border ${
                        errors.gender ? 'border-red-500' : 'border-gray-300'
                      } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`mt-1 block w-full rounded-md border ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>
                </div>

                {errors.submit && (
                  <p className="text-red-500 text-sm">{errors.submit}</p>
                )}

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : selectedPerson ? 'Update Person' : 'Save Person'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Person Details Modal */}
      {isDetailsOpen && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-semibold text-gray-900">Person Details</h2>
                </div>
                <button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setSelectedPerson(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                 {/* Basic Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-4 mb-4">
                      {selectedPerson.profileImage?.data ? (
                        <img 
                          src={`data:${selectedPerson.profileImage.contentType};base64,${arrayBufferToBase64(selectedPerson.profileImage.data)}`}
                          alt={`${selectedPerson.firstName} ${selectedPerson.lastName}`}
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                          <span className="text-2xl">{selectedPerson.firstName[0]}{selectedPerson.lastName[0]}</span>
                        </div>
                      )}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">Basic Information</h3>
                          <p className="text-gray-600">{selectedPerson.firstName} {selectedPerson.lastName}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-500">Full Name</label>
                          <p className="text-gray-900">{selectedPerson.firstName} {selectedPerson.lastName}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Gender</label>
                          <p className="text-gray-900 capitalize">{selectedPerson.gender}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Date of Birth</label>
                          <p className="text-gray-900">
                            {selectedPerson.dateOfBirth ? new Date(selectedPerson.dateOfBirth).toLocaleDateString() : 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{selectedPerson.email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{selectedPerson.phone || 'No phone provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Household Information */}
                {selectedPerson.householdId && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Household Information</h3>
                    <div className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">Member of a household</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeoplePage;