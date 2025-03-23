import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Users, ArrowLeft, Phone, CheckSquare, Square } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import NewComerRegistration from '../../components/NewComerRegistration.jsx';

const EventCheckin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [checkinError, setCheckinError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPeople, setSelectedPeople] = useState(new Set());
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [attendanceList, setAttendanceList] = useState([]);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [authCheckPending, setAuthCheckPending] = useState(true);


  useEffect(() => {
    console.log('Current user state:', {
      userExists: !!user,
      userDetails: user,
      hasId: !!user?._id,
      role: user?.role
    });
  }, [user]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await api.events.getById(id);
      console.log('Loaded event data:', data);
      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      const data = await api.events.getAttendance(id);
      setAttendanceList(data);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadEvent();
      loadAttendance();
    } else {
      navigate('/login');
    }
  }, [id, user, navigate]);

  useEffect(() => {
      if (!event || !user) {
        return; // Exit early if data not ready
      }
      
      try {
        console.log('Authorization check:', {
          userRole: user.role,
          userId: user._id,
          eventCheckInInCharge: event.checkInInCharge,
          isAdmin: user.role === 'admin'
        });
    
        // Normalize the event.checkInInCharge data to handle possible format differences
        const checkInCharges = Array.isArray(event.checkInInCharge) 
          ? event.checkInInCharge 
          : [];
        
        // More robust check that handles different data structures
        const authorized = 
          user.role === 'admin' || 
          user.role === 'check_in_staff' ||
          checkInCharges.some(charge => {
            // Handle both object structure and direct ID comparison
            const chargeId = charge._id || charge.userId || charge;
            return chargeId === user._id;
          });
        
        console.log('Authorization result:', { authorized });
        setIsAuthorized(authorized);
      } catch (error) {
        console.error('Error checking authorization:', error);
        setIsAuthorized(false);
      } finally {
        // Mark the auth check as complete
        setAuthCheckPending(false);
      }
    }, [event, user]);
  const handleSearch = async () => {
    if (!searchPhone || searchPhone.length < 3) return;

    try {
      setSearching(true);
      const results = await api.events.searchAttendees(id, searchPhone);
      const uniqueResults = Array.from(
        new Map(results.map(person => [person._id, person])).values()
      );
      setSearchResults(uniqueResults);
    } catch (error) {
      console.error('Error searching attendees:', error);
    } finally {
      setSearching(false);
    }
  };

  const togglePersonSelection = (personId) => {
    const newSelected = new Set(selectedPeople);
    if (newSelected.has(personId)) {
      newSelected.delete(personId);
    } else {
      newSelected.add(personId);
    }
    setSelectedPeople(newSelected);
  };

  const handleBulkCheckin = async () => {
    if (selectedPeople.size === 0) return;
    
    try {
      const selectedArray = Array.from(selectedPeople);
      let successCount = 0;
      let alreadyCheckedIn = [];
      
      for (const personId of selectedArray) {
        const person = searchResults.find(p => p._id === personId);
        try {
          await api.events.checkin(id, personId, user);
          successCount++;
        } catch (error) {
          const personName = person ? `${person.firstName} ${person.lastName}` : 'Unknown person';
          alreadyCheckedIn.push(personName);
        }
      }

      if (successCount > 0) {
        setSuccessMessage(`Checked in ${successCount} people`);
        setSelectedPeople(new Set());
        await loadEvent();
        await loadAttendance();
      }
      
      if (alreadyCheckedIn.length > 0) {
        setCheckinError(`Person already checked in: ${alreadyCheckedIn.join(', ')}`);
      }
    } catch (error) {
      setCheckinError('An unexpected error occurred');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Not Authorized</h2>
          <p className="text-red-600">You are not authorized to perform check-ins for this event.</p>
          <button
            onClick={() => navigate('/events')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Return to Events
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!event) {
    return <div className="text-center py-8 text-red-500">Event not found</div>;
  }
  const isCheckInEnabled = event.status === 'published' || event.status === 'in_progress';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/events')}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{event.name}</h1>
            <p className="text-sm text-gray-500">
              {new Date(event.startDateTime).toLocaleDateString()} {new Date(event.startDateTime).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {attendanceList.length || 0}
          </div>
          <div className="text-sm text-gray-500">Total Check-ins</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="text-blue-600" size={20} />
              <h2 className="text-lg font-semibold">Quick Check-in</h2>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="tel"
                placeholder="Search by phone number..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={!searchPhone || searching || !isCheckInEnabled}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>

            {checkinError && (
              <div className="p-2 text-red-500 text-sm">{checkinError}</div>
            )}

            {!isCheckInEnabled && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                <p className="text-yellow-700">Check-in is disabled for completed events</p>
              </div>
            )}

            {successMessage && (
              <div className="p-2 text-green-500 text-sm">{successMessage}</div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Search Results</h3>
                {searchResults.map((person) => (
                  <div
                    key={person._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => togglePersonSelection(person._id)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        {selectedPeople.has(person._id) ? (
                          <CheckSquare size={20} className="text-blue-600" />
                        ) : (
                          <Square size={20} />
                        )}
                      </button>
                      <div>
                        <div className="font-medium">{person.firstName} {person.lastName}</div>
                        <div className="text-sm text-gray-500">{person.phone}</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {selectedPeople.size > 0 && (
                  <button
                    onClick={handleBulkCheckin}
                    className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Check In {selectedPeople.size} Selected People
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {isAuthorized && (
  <NewComerRegistration 
    event={event} 
    isEnabled={event.status === 'published' || event.status === 'in_progress'}
    onAttendanceUpdate={loadAttendance} 
  />
)}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-blue-600" size={20} />
          <h2 className="text-lg font-semibold">Recent Check-ins</h2>
        </div>

        {attendanceList.length > 0 ? (
          <div className="space-y-2">
            {attendanceList.slice(0, 10).map((record) => (
              <div key={record._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">
                    {record.personName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(record.checkinTime).toLocaleTimeString()}
                  </div>
                </div>
                {record.checkedInBy && (
                   <div className="text-sm text-gray-500">
                    by {record.checkedInByName || record.checkedInBy.name}
                    </div>
                    )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No check-ins yet
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCheckin;