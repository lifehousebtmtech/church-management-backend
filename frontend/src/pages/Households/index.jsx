import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, Edit, Trash2, Users, PlusCircle, Eye, X, Phone } from 'lucide-react';
import PersonSearch from '../../components/PersonSearch/index';
import api from '../../services/api';

const HouseholdsPage = () => {
  const navigate = useNavigate();
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [editFormData, setEditFormData] = useState({
    headOfHousehold: null,
    spouse: null,
    children: [],
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    primaryPhone: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadHouseholds();
  }, []);

  const loadHouseholds = async () => {
    try {
      setLoading(true);
      const data = await api.households.getAll();
      setHouseholds(data.households || []);
    } catch (error) {
      console.error('Error loading households:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this household?')) return;
    try {
      await api.households.delete(id);
      await loadHouseholds();
    } catch (error) {
      console.error('Error deleting household:', error);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const submitData = {
        ...editFormData,
        headOfHousehold: editFormData.headOfHousehold._id,
        spouse: editFormData.spouse?._id,
        children: editFormData.children.map(child => child._id)
      };
      await api.households.update(selectedHousehold._id, submitData);
      setIsEditModalOpen(false);
      await loadHouseholds();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSaving(false);
    }
  };

  const getExcludedIds = () => {
    const ids = [];
    if (editFormData.headOfHousehold) ids.push(editFormData.headOfHousehold._id);
    if (editFormData.spouse) ids.push(editFormData.spouse._id);
    editFormData.children.forEach(child => ids.push(child._id));
    return ids;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!editFormData.headOfHousehold) newErrors.headOfHousehold = 'Head of household is required';
    if (!editFormData.address.street) newErrors.street = 'Street is required';
    if (!editFormData.address.city) newErrors.city = 'City is required';
    if (!editFormData.address.state) newErrors.state = 'State is required';
    if (!editFormData.address.zipCode) newErrors.zipCode = 'ZIP code is required';
    if (!editFormData.primaryPhone) newErrors.primaryPhone = 'Primary phone is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const filteredHouseholds = households.filter(household => {
    const searchLower = search.toLowerCase();
    return household.headOfHousehold && (
      household.headOfHousehold.firstName.toLowerCase().includes(searchLower) ||
      household.headOfHousehold.lastName.toLowerCase().includes(searchLower) ||
      household.address?.street.toLowerCase().includes(searchLower) ||
      household.address?.city.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900">Households</h1>
          </div>
          <button
            onClick={() => navigate('/households/create')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <PlusCircle size={20} />
            Add Household
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search households..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : filteredHouseholds.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No households found</div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Head of Household</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredHouseholds.map((household) => (
                  <tr key={household._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {household.headOfHousehold.firstName} {household.headOfHousehold.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {household.address.street}, {household.address.city}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">
                          {1 + (household.spouse ? 1 : 0) + (household.children?.length || 0)} members
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{household.primaryPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/households/${household._id}`)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedHousehold(household);
                            setEditFormData({
                              headOfHousehold: household.headOfHousehold,
                              spouse: household.spouse,
                              children: household.children || [],
                              address: household.address,
                              primaryPhone: household.primaryPhone
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(household._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Edit Household</h2>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedHousehold(null);
                    setErrors({});
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleEdit} className="space-y-6">
                {/* Head of Household */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="text-blue-600" size={20} />
                    <h3 className="text-lg font-semibold text-blue-900">Head of Household</h3>
                  </div>
                  <PersonSearch
                    onSelect={(person) => setEditFormData({ ...editFormData, headOfHousehold: person })}
                    excludeIds={getExcludedIds()}
                    placeholder="Search for head of household..."
                    preSelectedPerson={editFormData.headOfHousehold}
                  />
                  {errors.headOfHousehold && (
                    <p className="mt-2 text-sm text-red-500">{errors.headOfHousehold}</p>
                  )}
                </div>

                {/* Spouse */}
                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="text-green-600" size={20} />
                    <h3 className="text-lg font-semibold text-green-900">Spouse (Optional)</h3>
                  </div>
                  <PersonSearch
                    onSelect={(person) => setEditFormData({ ...editFormData, spouse: person })}
                    excludeIds={getExcludedIds()}
                    placeholder="Search for spouse..."
                    preSelectedPerson={editFormData.spouse}
                  />
                </div>

                {/* Children */}
                <div className="bg-yellow-50 p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="text-yellow-600" size={20} />
                      <h3 className="text-lg font-semibold text-yellow-900">Children</h3>
                    </div>
                    <PersonSearch
                      onSelect={(person) => setEditFormData({
                        ...editFormData,
                        children: [...editFormData.children, person]
                      })}
                      excludeIds={getExcludedIds()}
                      placeholder="Add child..."
                      className="w-64"
                    />
                  </div>
                  <div className="space-y-2">
                    {editFormData.children.map((child, index) => (
                      <div key={child._id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-gray-400" />
                          <span>{child.firstName} {child.lastName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditFormData({
                            ...editFormData,
                            children: editFormData.children.filter((_, i) => i !== index)
                          })}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address */}
                <div className="bg-purple-50 p-6 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Home className="text-purple-600" size={20} />
                    <h3 className="text-lg font-semibold text-purple-900">Address</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Street</label>
                      <input
                        type="text"
                        value={editFormData.address.street}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          address: { ...editFormData.address, street: e.target.value }
                        })}
                        className={`mt-1 block w-full rounded-md border ${
                          errors.street ? 'border-red-500' : 'border-gray-300'
                        } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                      />
                      {errors.street && (
                        <p className="mt-1 text-sm text-red-500">{errors.street}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        value={editFormData.address.city}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          address: { ...editFormData.address, city: e.target.value }
                        })}
                          className={`mt-1 block w-full rounded-md border ${
                            errors.city ? 'border-red-500' : 'border-gray-300'
                          } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                        />
                        {errors.city && (
                          <p className="mt-1 text-sm text-red-500">{errors.city}</p>
                        )}
                      </div>
  
                      <div>
                        <label className="block text-sm font-medium text-gray-700">State</label>
                        <input
                          type="text"
                          value={editFormData.address.state}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            address: { ...editFormData.address, state: e.target.value }
                          })}
                          className={`mt-1 block w-full rounded-md border ${
                            errors.state ? 'border-red-500' : 'border-gray-300'
                          } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                        />
                        {errors.state && (
                          <p className="mt-1 text-sm text-red-500">{errors.state}</p>
                        )}
                      </div>
  
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                        <input
                          type="text"
                          value={editFormData.address.zipCode}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            address: { ...editFormData.address, zipCode: e.target.value }
                          })}
                          className={`mt-1 block w-full rounded-md border ${
                            errors.zipCode ? 'border-red-500' : 'border-gray-300'
                          } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                        />
                        {errors.zipCode && (
                          <p className="mt-1 text-sm text-red-500">{errors.zipCode}</p>
                        )}
                      </div>
                    </div>
                  </div>
  
                  {/* Primary Phone */}
                  <div className="bg-red-50 p-6 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Phone className="text-red-600" size={20} />
                      <h3 className="text-lg font-semibold text-red-900">Primary Contact</h3>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Primary Phone Number</label>
                      <input
                        type="tel"
                        value={editFormData.primaryPhone}
                        onChange={(e) => setEditFormData({ ...editFormData, primaryPhone: e.target.value })}
                        className={`mt-1 block w-full rounded-md border ${
                          errors.primaryPhone ? 'border-red-500' : 'border-gray-300'
                        } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                      />
                      {errors.primaryPhone && (
                        <p className="mt-1 text-sm text-red-500">{errors.primaryPhone}</p>
                      )}
                    </div>
                  </div>
  
                  {errors.submit && (
                    <p className="text-red-500 text-sm">{errors.submit}</p>
                  )}
  
                  <div className="flex justify-end gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setSelectedHousehold(null);
                        setErrors({});
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
                      {saving ? 'Saving...' : 'Update Household'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };
  
  export default HouseholdsPage;