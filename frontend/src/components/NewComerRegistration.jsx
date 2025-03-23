import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const NewComerRegistration = ({ event, isEnabled, onAttendanceUpdate }) => {
    const { id } = useParams();
    const { user } = useAuth();
    const [newcomers, setNewcomers] = useState([]);
    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      gender: '',
      phone: '',
      invitedBy: ''
    });
    const [showAddMore, setShowAddMore] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
  
    const isAuthorized = user?.role === 'admin' || 
      event?.checkInInCharge?.some(charge => charge._id === user?._id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Register the person first
      const personData = {
        ...formData,
        eventId: id,
        eventRegistration: {
          eventId: id,
          registrationDate: new Date()
        }
      };
      
      const response = await fetch('http://localhost:5000/api/people/quick-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(personData)
      });

      const newPerson = await response.json();
      
      // 2. Create attendance record
      if (newPerson._id) {
        await api.events.checkin(id, newPerson._id, user);
        
        // 3. Update newcomers list and attendance counter
        setNewcomers([...newcomers, newPerson]);
        if (onAttendanceUpdate) {
          onAttendanceUpdate();
        }
      }

      setSuccess('Person registered and checked in successfully!');
      setFormData({
        firstName: '',
        lastName: '',
        gender: '',
        phone: showAddMore ? formData.phone : '',
        invitedBy: showAddMore ? formData.invitedBy : ''
      });
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to register person');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const loadNewcomers = async () => {
    try {
      const data = await api.events.getNewcomers(id);
      setNewcomers(data);
    } catch (error) {
      console.error('Error loading newcomers:', error);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadNewcomers();
    }
  }, [id, isAuthorized]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Registration</h2>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            name="invitedBy"
            placeholder="Invited By"
            value={formData.invitedBy}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex justify-between items-center">
          <button
                type="submit"
                disabled={!isEnabled}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                Register
                </button>

            <button
              type="button"
              onClick={() => setShowAddMore(!showAddMore)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
            >
              {showAddMore ? 'Hide Add More' : 'Add More Person'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          New Comers ({newcomers.length})
        </h2>
        {newcomers.length > 0 ? (
          <ul className="space-y-2">
            {newcomers.map((person, index) => (
              <li key={index} className="p-2 bg-gray-50 rounded flex justify-between items-center">
                <span className="font-medium">{person.firstName} {person.lastName}</span>
                <span className="text-sm text-gray-500">Invited by: {person.invitedBy || 'N/A'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">No new registrations yet</p>
        )}
      </div>
    </div>
  );
};

export default NewComerRegistration;