import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, X, Phone, Home } from 'lucide-react';
import PersonSearch from '../../components/PersonSearch/index';
import api from '../../services/api';

const CreateHousehold = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.headOfHousehold) newErrors.headOfHousehold = 'Head of household is required';
    if (!formData.address.street) newErrors.street = 'Street is required';
    if (!formData.address.city) newErrors.city = 'City is required';
    if (!formData.address.state) newErrors.state = 'State is required';
    if (!formData.address.zipCode) newErrors.zipCode = 'ZIP code is required';
    if (!formData.primaryPhone) newErrors.primaryPhone = 'Primary phone is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const submitData = {
        ...formData,
        headOfHousehold: formData.headOfHousehold._id,
        spouse: formData.spouse?._id,
        children: formData.children.map(child => child._id)
      };
      await api.households.create(submitData);
      navigate('/households');
    } catch (error) {
      setErrors({ submit: error.message });
      setSaving(false);
    }
  };

  const getExcludedIds = () => {
    const ids = [];
    if (formData.headOfHousehold) ids.push(formData.headOfHousehold._id);
    if (formData.spouse) ids.push(formData.spouse._id);
    formData.children.forEach(child => ids.push(child._id));
    return ids;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900">Add New Household</h1>
          </div>
          <button
            onClick={() => navigate('/households')}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Head of Household */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-blue-600" size={20} />
              <h3 className="text-lg font-semibold text-blue-900">Head of Household</h3>
            </div>
            <PersonSearch
              onSelect={(person) => setFormData({ ...formData, headOfHousehold: person })}
              excludeIds={getExcludedIds()}
              placeholder="Search for head of household..."
              preSelectedPerson={formData.headOfHousehold}
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
              onSelect={(person) => setFormData({ ...formData, spouse: person })}
              excludeIds={getExcludedIds()}
              placeholder="Search for spouse..."
              preSelectedPerson={formData.spouse}
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
                onSelect={(person) => setFormData({
                  ...formData,
                  children: [...formData.children, person]
                })}
                excludeIds={getExcludedIds()}
                placeholder="Add child..."
                className="w-64"
              />
            </div>
            <div className="space-y-2">
              {formData.children.map((child, index) => (
                <div key={child._id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <span>{child.firstName} {child.lastName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      children: formData.children.filter((_, i) => i !== index)
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
                  value={formData.address.street}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value }
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
                  value={formData.address.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value }
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
                  value={formData.address.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value }
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
                  value={formData.address.zipCode}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, zipCode: e.target.value }
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
                value={formData.primaryPhone}
                onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
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
              onClick={() => navigate('/households')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Create Household'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateHousehold;