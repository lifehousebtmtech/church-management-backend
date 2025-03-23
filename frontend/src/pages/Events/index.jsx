import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, PlusCircle, Search, Edit, Trash2, Eye, Info } from 'lucide-react';
import api from '../../services/api';

const EventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadEvents();
  }, [filters]);

  useEffect(() => {
    const refreshInterval = setInterval(loadEvents, 60000); // Refresh list every minute
    return () => clearInterval(refreshInterval);
  }, [filters]);
  useEffect(() => {
    const updateEventStatuses = async () => {
      const updatedEvents = events.map(event => {
        const now = new Date();
        const startDate = new Date(event.startDateTime);
        const endDate = new Date(event.endDateTime);
        
        if (event.status === 'published' || event.status === 'in_progress') {
          if (now >= startDate && now <= endDate) {
            return { ...event, status: 'in_progress' };
          } else if (now > endDate) {
            return { ...event, status: 'completed' };
          }
        }
        return event;
      });
  
      // Check if any status changed
      const needsUpdate = updatedEvents.some((event, index) => 
        event.status !== events[index].status
      );
  
      if (needsUpdate) {
        setEvents(updatedEvents);
        await Promise.all(updatedEvents.map(event => {
          if (event.status !== events.find(e => e._id === event._id).status) {
            return api.events.update(event._id, { status: event.status });
          }
        }));
      }
    };
  
    const statusInterval = setInterval(updateEventStatuses, 30000); // Check every 30 seconds
    updateEventStatuses(); // Initial check
  
    return () => clearInterval(statusInterval);
  }, [events]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await api.events.getAll(filters);
      setEvents(response.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.events.delete(id);
      // Refresh the events list
      await loadEvents();
      // Optionally show success message
      alert('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      // Show error message to user
      alert('Failed to delete event. Please try again.');
    }
  };

  const filteredEvents = events.filter(event => 
    event.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Events</h1>
        </div>
        <button
          onClick={() => navigate('/events/create')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PlusCircle size={20} />
          Create Event
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search events..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No events found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teams</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <tr key={event._id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{event.name}</div>
                      {event.isRecurring && (
                        <div className="text-xs text-gray-500">Recurring Event</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(event.startDateTime).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.startDateTime).toLocaleTimeString()} - 
                        {new Date(event.endDateTime).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                        {event.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {event.welcomeTeam?.length || 0} Welcome,{' '}
                        {event.cafeTeam?.length || 0} Cafe,{' '}
                        {event.mediaTeam?.length || 0} Media
                      </div>
                    </td>
                    <td className="px-6 py-4">
  <div className="flex items-center justify-center gap-2">
    <button
      onClick={() => navigate(`/events/${event._id}/details`)}
      className="text-indigo-600 hover:text-indigo-800"
      title="View Details"
    >
      <Info size={18} />
    </button>
    {(['published', 'in_progress', 'completed'].includes(event.status)) && (
      <button
        onClick={() => navigate(`/events/${event._id}/checkin`)}
        className="text-green-600 hover:text-green-800"
        title="Check-in"
      >
        <Eye size={18} />
      </button>
    )}
    <button
      onClick={() => navigate(`/events/${event._id}`)}
      className="text-blue-600 hover:text-blue-800"
      title="Edit"
    >
      <Edit size={18} />
    </button>
    <button
      onClick={() => handleDelete(event._id)}
      className="text-red-600 hover:text-red-800"
      title="Delete"
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
    </div>
  );
};

export default EventsPage;