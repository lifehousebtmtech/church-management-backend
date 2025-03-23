import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, Edit, ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';

const HouseholdViewEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [household, setHousehold] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    loadHousehold();
  }, [id]);

  const loadHousehold = async () => {
    try {
      setLoading(true);
      const data = await api.households.getOne(id);
      setHousehold(data);
      setFormData(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.households.update(id, formData);
      await loadHousehold();
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.households.removeMember(id, memberId);
      await loadHousehold();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!household) return <div className="text-center p-4">Household not found</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/households')}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
              <Home className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-semibold text-gray-900">
                {household.headOfHousehold.firstName} {household.headOfHousehold.lastName} Household
              </h1>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-blue-600 hover:text-blue-700"
          >
            {isEditing ? <X size={24} /> : <Edit size={24} />}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Address */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium text-purple-900 mb-4">Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Street</label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.address.zipCode}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, zipCode: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium text-red-900 mb-4">Contact Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">Primary Phone</label>
                <input
                  type="tel"
                  value={formData.primaryPhone}
                  onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <div className="flex items-center gap-2">
                  <Save size={16} />
                  Save Changes
                </div>
              </button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="space-y-6">
            {/* Members */}
            <div className="space-y-4">
              {/* Head of Household */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-blue-900 mb-2">Head of Household</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {household.headOfHousehold.firstName} {household.headOfHousehold.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{household.headOfHousehold.email}</p>
                  </div>
                </div>
              </div>

              {/* Spouse */}
              {household.spouse && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h2 className="text-lg font-medium text-green-900 mb-2">Spouse</h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {household.spouse.firstName} {household.spouse.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{household.spouse.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Children */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-yellow-900 mb-2">Children</h2>
                {household.children.length === 0 ? (
                  <p className="text-sm text-gray-500">No children</p>
                ) : (
                  <div className="space-y-2">
                    {household.children.map((child) => (
                      <div key={child._id} className="flex items-center justify-between bg-white p-2 rounded">
                        <div>
                          <p className="text-sm font-medium">
                            {child.firstName} {child.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{child.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium text-purple-900 mb-2">Address</h2>
              <p className="text-sm">
                {household.address.street}<br />
                {household.address.city}, {household.address.state} {household.address.zipCode}
              </p>
            </div>

            {/* Contact Information */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium text-red-900 mb-2">Contact Information</h2>
              <p className="text-sm">
                Primary Phone: {household.primaryPhone}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HouseholdViewEdit;