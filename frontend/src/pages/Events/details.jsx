import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Users, Clock, MapPin, Info } from 'lucide-react';
import api from '../../services/api';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEventDetails = async () => {
      try {
        setLoading(true);
        const data = await api.events.getById(id);
        setEvent(data);
      } catch (error) {
        console.error('Error loading event details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEventDetails();
  }, [id]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!event) {
    return <div className="text-center py-8 text-red-500">Event not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/events')}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={24} />
            </button>
            <Calendar className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900">{event.name}</h1>
          </div>
          <div className={`px-3 py-1 text-sm font-medium rounded-full 
            ${event.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
              event.status === 'published' ? 'bg-blue-100 text-blue-800' :
              event.status === 'in_progress' ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'}`}
          >
            {event.status.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        {/* Event Details */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Event Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Clock className="text-blue-500 mt-1" size={18} />
                <div>
                  <div className="font-medium">Date & Time</div>
                  <div>
                    {new Date(event.startDateTime).toLocaleDateString()} {' '}
                    {new Date(event.startDateTime).toLocaleTimeString()} to {' '}
                    {new Date(event.endDateTime).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              {event.isRecurring && (
                <div className="flex items-start gap-2">
                  <Calendar className="text-blue-500 mt-1" size={18} />
                  <div>
                    <div className="font-medium">Recurring</div>
                    <div>
                      {event.recurringDetails.frequency.charAt(0).toUpperCase() + 
                       event.recurringDetails.frequency.slice(1)} on {' '}
                      {event.recurringDetails.days.map(day => 
                        day.charAt(0).toUpperCase() + day.slice(1)
                      ).join(', ')}
                    </div>
                  </div>
                </div>
              )}
              
              {event.description && (
                <div className="md:col-span-2 flex items-start gap-2">
                  <Info className="text-blue-500 mt-1" size={18} />
                  <div>
                    <div className="font-medium">Description</div>
                    <div className="whitespace-pre-line">{event.description}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Leadership */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-green-900 mb-4">Event Leadership</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="font-medium mb-2">Event In-Charge</div>
                {event.eventInCharge && event.eventInCharge.length > 0 ? (
                  <ul className="space-y-1">
                    {event.eventInCharge.map(leader => (
                      <li key={leader.userId} className="flex items-center gap-2">
                        <Users size={16} className="text-green-600" />
                        <span>{leader.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">None assigned</div>
                )}
              </div>
              
              <div>
                <div className="font-medium mb-2">Check-in In-Charge</div>
                {event.checkInInCharge && event.checkInInCharge.length > 0 ? (
                  <ul className="space-y-1">
                    {event.checkInInCharge.map(leader => (
                      <li key={leader.userId} className="flex items-center gap-2">
                        <Users size={16} className="text-green-600" />
                        <span>{leader.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">None assigned</div>
                )}
              </div>
              
              {event.welcomeTeamLead && (
                <div>
                  <div className="font-medium mb-2">Welcome Team Lead</div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-green-600" />
                    <span>{event.welcomeTeamLead.name}</span>
                  </div>
                </div>
              )}
              
              {event.cafeTeamLead && (
                <div>
                  <div className="font-medium mb-2">Cafe Team Lead</div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-green-600" />
                    <span>{event.cafeTeamLead.name}</span>
                  </div>
                </div>
              )}
              
              {event.mediaTeamLead && (
                <div>
                  <div className="font-medium mb-2">Media Team Lead</div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-green-600" />
                    <span>{event.mediaTeamLead.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Team Members */}
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-yellow-900 mb-4">Team Members</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <div className="font-medium mb-2">Welcome Team ({event.welcomeTeam?.length || 0})</div>
                {event.welcomeTeam && event.welcomeTeam.length > 0 ? (
                  <ul className="space-y-1">
                    {event.welcomeTeam.map(member => (
                      <li key={member.person} className="text-sm">
                        {member.personName}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">No team members</div>
                )}
              </div>
              
              <div>
                <div className="font-medium mb-2">Cafe Team ({event.cafeTeam?.length || 0})</div>
                {event.cafeTeam && event.cafeTeam.length > 0 ? (
                  <ul className="space-y-1">
                    {event.cafeTeam.map(member => (
                      <li key={member.person} className="text-sm">
                        {member.personName}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">No team members</div>
                )}
              </div>
              
              <div>
                <div className="font-medium mb-2">Media Team ({event.mediaTeam?.length || 0})</div>
                {event.mediaTeam && event.mediaTeam.length > 0 ? (
                  <ul className="space-y-1">
                    {event.mediaTeam.map(member => (
                      <li key={member.person} className="text-sm">
                        {member.personName}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">No team members</div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => navigate('/events')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back to Events
            </button>
            
            {/* Only show Check-in button for appropriate status */}
            {(['published', 'in_progress', 'completed'].includes(event.status)) && (
              <button
                onClick={() => navigate(`/events/${event._id}/checkin`)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Go to Check-in
              </button>
            )}
            
            <button
              onClick={() => navigate(`/events/${event._id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;