import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, X, Users } from 'lucide-react';
import UserSearch from '../../components/UserSearch';
import PersonSearch from '../../components/PersonSearch';
import api from '../../services/api';

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    startDateTime: '',
    endDateTime: '',
    description: '',
    status: '',
    isRecurring: false,
    recurringDetails: {
      frequency: 'weekly',
      days: [],
      endDate: ''
    },
    eventInCharge: [], // [{userId, name}]
    welcomeTeamLead: null, // {userId, name}
    checkInInCharge: [], // [{userId, name}]
    cafeTeamLead: null, // {userId, name}
    mediaTeamLead: null, // {userId, name}
    welcomeTeam: [], // [{person, personName}]
    cafeTeam: [], // [{person, personName}]
    mediaTeam: [] // [{person, personName}]
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [id]);

  useEffect(() => {
    const checkAndUpdateStatus = async () => {
      if (!formData.startDateTime || !formData.endDateTime) return;

      const now = new Date();
      const startDate = new Date(formData.startDateTime);
      const endDate = new Date(formData.endDateTime);
      let newStatus = formData.status;

      if (formData.status === 'published' || formData.status === 'in_progress') {
        if (now >= startDate && now <= endDate) {
          newStatus = 'in_progress';
        } else if (now > endDate) {
          newStatus = 'completed';
        }
      }

      if (newStatus !== formData.status) {
        try {
          await api.events.update(id, { status: newStatus });
          setFormData(prev => ({ ...prev, status: newStatus }));
        } catch (error) {
          console.error('Error updating status:', error);
        }
      }
    };

    const statusInterval = setInterval(checkAndUpdateStatus, 30000);
    checkAndUpdateStatus();
    
    return () => clearInterval(statusInterval);
  }, [formData.startDateTime, formData.endDateTime, formData.status, id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const event = await api.events.getById(id);
      
      // Convert UTC to local timezone and format for datetime-local input
      const formattedEvent = {
        ...event,
        startDateTime: formatDateForInput(event.startDateTime),
        endDateTime: formatDateForInput(event.endDateTime),
        recurringDetails: {
          ...event.recurringDetails,
          endDate: event.recurringDetails?.endDate ? 
            formatDateForInput(event.recurringDetails.endDate).slice(0, 10) : 
            ''
        }
      };
      
      setFormData(formattedEvent);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('sv-SE', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(' ', 'T');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Event name is required';
    if (!formData.startDateTime) newErrors.startDateTime = 'Start date & time is required';
    if (!formData.endDateTime) newErrors.endDateTime = 'End date & time is required';
    if (formData.eventInCharge.length === 0) newErrors.eventInCharge = 'At least one event in-charge is required';
    if (formData.checkInInCharge.length === 0) newErrors.checkInInCharge = 'At least one check-in in-charge is required';
    if (formData.isRecurring) {
      if (!formData.recurringDetails.frequency) newErrors.frequency = 'Frequency is required for recurring events';
      if (formData.recurringDetails.days.length === 0) newErrors.days = 'Select at least one day for recurring events';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      await api.events.update(id, formData);
      navigate('/events');
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!['draft', 'published'].includes(newStatus)) {
      return;
    }

    try {
      setSaving(true);
      await api.events.update(id, { ...formData, status: newStatus });
      setFormData({ ...formData, status: newStatus });
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSaving(false);
    }
  };

  // Leadership role handlers
  const handleEventInChargeSelect = (user) => {
    setFormData({
      ...formData,
      eventInCharge: [
        ...formData.eventInCharge,
        {
          userId: user._id,
          name: user.name
        }
      ]
    });
  };

  const handleWelcomeTeamLeadSelect = (user) => {
    setFormData({
      ...formData,
      welcomeTeamLead: user ? {
        userId: user._id,
        name: user.name
      } : null
    });
  };

  const handleCheckInInChargeSelect = (user) => {
    setFormData({
      ...formData,
      checkInInCharge: [
        ...formData.checkInInCharge,
        {
          userId: user._id,
          name: user.name
        }
      ]
    });
  };

  const handleCafeTeamLeadSelect = (user) => {
    setFormData({
      ...formData,
      cafeTeamLead: user ? {
        userId: user._id,
        name: user.name
      } : null
    });
  };

  const handleMediaTeamLeadSelect = (user) => {
    setFormData({
      ...formData,
      mediaTeamLead: user ? {
        userId: user._id,
        name: user.name
      } : null
    });
  };

  // Team member handlers
  const handleTeamMemberSelect = (person, team) => {
    setFormData({
      ...formData,
      [team]: [
        ...formData[team],
        {
          person: person._id,
          personName: `${person.firstName} ${person.lastName}`
        }
      ]
    });
  };

  const handleRemoveTeamMember = (team, index) => {
    setFormData({
      ...formData,
      [team]: formData[team].filter((_, i) => i !== index)
    });
  };

  const handleRecurringDayToggle = (day) => {
    const days = formData.recurringDetails.days;
    const newDays = days.includes(day)
      ? days.filter(d => d !== day)
      : [...days, day];
    
    setFormData({
      ...formData,
      recurringDetails: {
        ...formData.recurringDetails,
        days: newDays
      }
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900">Edit Event</h1>
          </div>
          <button
            onClick={() => navigate('/events')}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Status Management Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Event Status</h2>
          <div className="flex gap-4">
            <button
              onClick={() => handleStatusChange('draft')}
              disabled={['in_progress', 'completed'].includes(formData.status)}
              className={`px-4 py-2 rounded-lg ${
                formData.status === 'draft' 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-gray-100 text-gray-700 disabled:opacity-50'
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => handleStatusChange('published')}
              disabled={['in_progress', 'completed'].includes(formData.status)}
              className={`px-4 py-2 rounded-lg ${
                formData.status === 'published' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-100 text-blue-700 disabled:opacity-50'
              }`}
            >
              Published
            </button>
            {/* Read-only status indicators */}
            <div className={`px-4 py-2 rounded-lg ${
              formData.status === 'in_progress' 
                ? 'bg-green-600 text-white' 
                : 'bg-green-100 text-green-700'
            }`}>
              In Progress
            </div>
            <div className={`px-4 py-2 rounded-lg ${
              formData.status === 'completed' 
                ? 'bg-purple-600 text-white' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              Completed
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Note: In Progress and Completed statuses are automatically set based on event time
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Event Information */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Event Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Event Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`mt-1 block w-full rounded-md border ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.startDateTime}
                  onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                  className={`mt-1 block w-full rounded-md border ${
                    errors.startDateTime ? 'border-red-500' : 'border-gray-300'
                  } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                />
                {errors.startDateTime && (
                  <p className="mt-1 text-sm text-red-500">{errors.startDateTime}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.endDateTime}
                  onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
                  className={`mt-1 block w-full rounded-md border ${
                    errors.endDateTime ? 'border-red-500' : 'border-gray-300'
                  } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                />
                {errors.endDateTime && (
                  <p className="mt-1 text-sm text-red-500">{errors.endDateTime}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Recurring Event Settings */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-purple-600" size={20} />
              <h3 className="text-lg font-semibold text-purple-900">Recurring Event</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                  <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                  This is a recurring event
                </label>
              </div>

              {formData.isRecurring && (
                <div className="space-y-4 pl-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <select
                      value={formData.recurringDetails.frequency}
                      onChange={(e) => setFormData({
                        ...formData,
                        recurringDetails: {
                          ...formData.recurringDetails,
                          frequency: e.target.value
                        }
                      })}
                      className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Days</label>
                    <div className="flex flex-wrap gap-2">
                      {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleRecurringDayToggle(day)}
                          className={`px-3 py-1 rounded-full text-sm ${
                            formData.recurringDetails.days.includes(day)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </button>
                      ))}
                    </div>
                    {errors.days && (
                      <p className="mt-1 text-sm text-red-500">{errors.days}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                    <input
                      type="date"
                      value={formData.recurringDetails.endDate}
                      onChange={(e) => setFormData({
                        ...formData,
                        recurringDetails: {
                          ...formData.recurringDetails,
                          endDate: e.target.value
                        }
                      })}
                      className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Leadership Roles */}
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-green-600" size={20} />
              <h3 className="text-lg font-semibold text-green-900">Leadership Roles</h3>
            </div>

            <div className="space-y-6">
              {/* Event In-Charge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event In-Charge</label>
                <div className="space-y-2">
                  {formData.eventInCharge.map((user, index) => (
                    <div key={user.userId} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-300">
                      <span className="text-gray-900">{user.name}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          eventInCharge: formData.eventInCharge.filter((_, i) => i !== index)
                        })}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <UserSearch
                    onSelect={handleEventInChargeSelect}
                    excludeIds={formData.eventInCharge.map(user => user.userId)}
                    placeholder="Search for event in-charge..."
                  />
                </div>
                {errors.eventInCharge && (
                  <p className="mt-1 text-sm text-red-500">{errors.eventInCharge}</p>
                )}
              </div>

              {/* Welcome Team Lead */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Welcome Team Lead</label>
                <div className="space-y-2">
                  {formData.welcomeTeamLead && (
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-300">
                      <span className="text-gray-900">{formData.welcomeTeamLead.name}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          welcomeTeamLead: null
                        })}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  {!formData.welcomeTeamLead && (
                    <UserSearch
                      onSelect={handleWelcomeTeamLeadSelect}
                      placeholder="Search for welcome team lead..."
                    />
                  )}
                </div>
              </div>

              {/* Check-in In-Charge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Check-in In-Charge</label>
                <div className="space-y-2">
                  {formData.checkInInCharge.map((user, index) => (
                    <div key={user.userId} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-300">
                      <span className="text-gray-900">{user.name}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          checkInInCharge: formData.checkInInCharge.filter((_, i) => i !== index)
                        })}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <UserSearch
                    onSelect={handleCheckInInChargeSelect}
                    excludeIds={formData.checkInInCharge.map(user => user.userId)}
                    placeholder="Search for check-in in-charge..."
                  />
                </div>
                {errors.checkInInCharge && (
                  <p className="mt-1 text-sm text-red-500">{errors.checkInInCharge}</p>
                )}
              </div>

              {/* Cafe Team Lead */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cafe Team Lead</label>
                <div className="space-y-2">
                  {formData.cafeTeamLead && (
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-300">
                      <span className="text-gray-900">{formData.cafeTeamLead.name}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          cafeTeamLead: null
                        })}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  {!formData.cafeTeamLead && (
                    <UserSearch
                      onSelect={handleCafeTeamLeadSelect}
                      placeholder="Search for cafe team lead..."
                    />
                  )}
                </div>
              </div>

              {/* Media Team Lead */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Media Team Lead</label>
                <div className="space-y-2">
                  {formData.mediaTeamLead && (
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-300">
                      <span className="text-gray-900">{formData.mediaTeamLead.name}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          mediaTeamLead: null
                        })}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  {!formData.mediaTeamLead && (
                    <UserSearch
                      onSelect={handleMediaTeamLeadSelect}
                      placeholder="Search for media team lead..."
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-yellow-50 p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-yellow-600" size={20} />
              <h3 className="text-lg font-semibold text-yellow-900">Team Members</h3>
            </div>

            <div className="space-y-6">
              {/* Welcome Team */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Welcome Team</label>
                  <PersonSearch
                    onSelect={(person) => handleTeamMemberSelect(person, 'welcomeTeam')}
                    excludeIds={[
                      ...formData.welcomeTeam.map(m => m.person),
                      ...formData.cafeTeam.map(m => m.person),
                      ...formData.mediaTeam.map(m => m.person)
                    ]}
                    placeholder="Add team member..."
                    className="w-64"
                  />
                </div>
                <div className="space-y-2">
                  {formData.welcomeTeam.map((member, index) => (
                    <div key={member.person} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-300">
                      <span className="text-gray-900">{member.personName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamMember('welcomeTeam', index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cafe Team */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Cafe Team</label>
                  <PersonSearch
                    onSelect={(person) => handleTeamMemberSelect(person, 'cafeTeam')}
                    excludeIds={[
                      ...formData.welcomeTeam.map(m => m.person),
                      ...formData.cafeTeam.map(m => m.person),
                      ...formData.mediaTeam.map(m => m.person)
                    ]}
                    placeholder="Add team member..."
                    className="w-64"
                  />
                </div>
                <div className="space-y-2">
                  {formData.cafeTeam.map((member, index) => (
                    <div key={member.person} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-300">
                      <span className="text-gray-900">{member.personName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamMember('cafeTeam', index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Media Team */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Media Team</label>
                  <PersonSearch
                    onSelect={(person) => handleTeamMemberSelect(person, 'mediaTeam')}
                    excludeIds={[
                      ...formData.welcomeTeam.map(m => m.person),
                      ...formData.cafeTeam.map(m => m.person),
                      ...formData.mediaTeam.map(m => m.person)
                    ]}
                    placeholder="Add team member..."
                    className="w-64"
                  />
                </div>
                <div className="space-y-2">
                  {formData.mediaTeam.map((member, index) => (
                    <div key={member.person} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-300">
                      <span className="text-gray-900">{member.personName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamMember('mediaTeam', index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="text-red-500 text-sm">{errors.submit}</div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEvent;