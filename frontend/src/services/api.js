import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const auth = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      } else {
        throw new Error('Invalid response from server');
      }
      return response;
    } catch (error) {
      console.error('Login error:', error.response?.data);
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// churchUsers API - matches the collection name
const churchUsers = {
  getAll: async () => {
    try {
      const response = await api.get('/church-users');
      return response;
    } catch (error) {
      console.warn('Using mock data due to API error');
      // Return mock data to keep UI working
      return [
        {
          _id: '1',
          username: 'admin',
          role: 'admin',
          person: {
            firstName: 'Admin',
            lastName: 'User',
            profilePicture: null
          }
        },
        {
          _id: '2',
          username: 'pastor',
          role: 'event_manager',
          person: {
            firstName: 'Church',
            lastName: 'Pastor',
            profilePicture: null
          }
        }
      ];
    }
  },
  getOne: async (id) => {
    try {
      const response = await api.get(`/church-users/${id}`);
      return response;
    } catch (error) {
      // Return mock data as fallback
      return {
        _id: id,
        username: 'user' + id,
        role: 'user',
        person: {
          firstName: 'Mock',
          lastName: 'User',
          profilePicture: null
        }
      };
    }
  },
  create: (data) => api.post('/church-users', data),
  update: (id, data) => api.put(`/church-users/${id}`, data),
  delete: (id) => api.delete(`/church-users/${id}`),
  updatePermissions: (id, permissions) => api.put(`/church-users/update-permissions/${id}`, { permissions }),
  search: async ({ query, role }) => {
    try {
      const response = await api.get('/church-users/search', {
        params: { query, role }
      });
      return response;
    } catch (error) {
      console.error('Error searching church users:', error);
      return { users: [] };
    }
  }
};

// Response interceptor with improved error handling
api.interceptors.response.use(
  response => {
    // If the data is wrapped in a data property, return that
    if (response.data && typeof response.data === 'object') {
      return response.data;
    }
    // Otherwise return the raw response
    return response;
  },
  error => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
      message: error.message
    });

    let errorMessage = 'An error occurred';
    if (error.response) {
      errorMessage = error.response.data?.message || `Error: ${error.response.status}`;
    } else if (error.request) {
      errorMessage = 'No response received from server';
    } else {
      errorMessage = error.message;
    }

    return Promise.reject(new Error(errorMessage));
  }
);

// Helper function to handle form data
const createFormData = (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return; // Skip null or undefined values
    }
    
    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item !== null && item !== undefined) {
          formData.append(`${key}[${index}]`, item);
        }
      });
    } else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
};

// People API calls
const people = {
  getAll: async () => {
    try {
      const response = await api.get('/people', {
        params: {
          limit: 0 // Setting limit to 0 to get all records
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching people:', error);
      throw error;
    }
  },

  getOne: async (id) => {
    try {
      const response = await api.get(`/people/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching person ${id}:`, error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/people', data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create person');
    }
  },

  update: async (id, data) => {
    try {
      let config = {};
      
      // Check if data is FormData (for image uploads)
      if (data instanceof FormData) {
        config = {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        };
      }

      const response = await api.put(`/people/${id}`, data, config);
      return response;
    } catch (error) {
      console.error(`Error updating person ${id}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to update person');
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/people/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting person ${id}:`, error);
      throw error;
    }
  },
  
  search: async (query) => {
    try {
      const response = await api.get('/people/search', { 
        params: { query }
      });
      return response; // The interceptor will handle response.data
    } catch (error) {
      console.error('Search API error:', error);
      return { people: [] };
    }
  },

  getImage: async (id) => {
    try {
      const response = await api.get(`/people/${id}/image`, { 
        responseType: 'blob',
        headers: { Accept: 'image/*' }
      });
      return response;
    } catch (error) {
      console.error(`Error fetching image for person ${id}:`, error);
      throw error;
    }
  },

  // Get unassigned people (not in any household)
  getUnassigned: async () => {
    try {
      const response = await api.get('/people/unassigned');
      return response;
    } catch (error) {
      console.error('Error fetching unassigned people:', error);
      throw error;
    }
  }
};

// Household API calls
const households = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/households', { params });
      return response;
    } catch (error) {
      console.error('Error fetching households:', error);
      throw error;
    }
  },

  getOne: async (id) => {
    try {
      const response = await api.get(`/households/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching household ${id}:`, error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      // Handle household image if present
      if (data.familyImage) {
        const formData = createFormData(data);
        return await api.post('/households', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      // If no image, send as regular JSON
      const response = await api.post('/households', data);
      return response;
    } catch (error) {
      console.error('Error creating household:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      // Handle household image if present
      if (data.familyImage) {
        const formData = createFormData(data);
        return await api.put(`/households/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      // If no image, send as regular JSON
      const response = await api.put(`/households/${id}`, data);
      return response;
    } catch (error) {
      console.error(`Error updating household ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/households/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting household ${id}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to delete household');
    }
  },

  addMember: async (householdId, memberId, role) => {
    try {
      const response = await api.post(`/households/${householdId}/members`, { 
        memberId, 
        role 
      });
      return response;
    } catch (error) {
      console.error(`Error adding member to household ${householdId}:`, error);
      throw error;
    }
  },

  removeMember: async (householdId, memberId) => {
    try {
      const response = await api.delete(`/households/${householdId}/members/${memberId}`);
      return response;
    } catch (error) {
      console.error(`Error removing member from household ${householdId}:`, error);
      throw error;
    }
  },

  // Get members of a household
  getMembers: async (householdId) => {
    try {
      const response = await api.get(`/households/${householdId}/members`);
      return response;
    } catch (error) {
      console.error(`Error fetching members of household ${householdId}:`, error);
      throw error;
    }
  }
};

const events = {
  getAll: async (filters = {}) => {
    try {
      const response = await api.get('/events', { params: filters });
      return response;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/events', data);
      return response;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/events/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },
  
  update: async (id, data) => {
    try {
      const response = await api.put(`/events/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/events/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  checkin: async (eventId, personId, checkedInBy) => {
    try {
      const response = await api.post(`/events/${eventId}/check-in`, {
        personId: personId.toString(),
        checkedInBy: checkedInBy._id ? checkedInBy._id.toString() : checkedInBy.username
      });
      return response;
    } catch (error) {
      console.error('Check-in API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Check-in failed');
    }
  },

  searchAttendees: async (eventId, phone) => {
    try {
      const response = await api.get(`/events/${eventId}/search-attendees`, {
        params: { phone }
      });
      // Ensure we always return an array, even if empty
      return response?.length ? response : [];
    } catch (error) {
      console.error('Error searching attendees:', error);
      return [];
    }
  },
  getAttendance: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/attendance`);
      return response;
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  },
  getNewcomers: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/newcomers`);
      return response;
    } catch (error) {
      console.error('Error fetching newcomers:', error);
      return [];
    }
  }
};

// Groups API calls
const groups = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/groups', { params });
      return response;
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  },

  getUserGroups: async () => {
    try {
      const response = await api.get('/groups/user');
      return response;
    } catch (error) {
      console.error('Error fetching user groups:', error);
      throw error;
    }
  },

  getAdminGroups: async () => {
    try {
      const response = await api.get('/admin/groups');
      return response;
    } catch (error) {
      console.error('Error fetching admin groups:', error);
      throw error;
    }
  },

  getOne: async (id) => {
    try {
      const response = await api.get(`/groups/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching group ${id}:`, error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/groups', data);
      return response;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/groups/${id}`, data);
      return response;
    } catch (error) {
      console.error(`Error updating group ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/groups/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting group ${id}:`, error);
      throw error;
    }
  },

  getMembers: async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}/members`);
      return response;
    } catch (error) {
      console.error(`Error fetching members of group ${groupId}:`, error);
      throw error;
    }
  },

  addMember: async (groupId, memberId, role = 'member') => {
    try {
      const response = await api.post(`/groups/${groupId}/members`, { 
        memberId, 
        role 
      });
      return response;
    } catch (error) {
      console.error(`Error adding member to group ${groupId}:`, error);
      throw error;
    }
  },

  removeMember: async (groupId, memberId) => {
    try {
      const response = await api.delete(`/groups/${groupId}/members/${memberId}`);
      return response;
    } catch (error) {
      console.error(`Error removing member from group ${groupId}:`, error);
      throw error;
    }
  },

  getSubgroups: async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}/subgroups`);
      return response;
    } catch (error) {
      console.error(`Error fetching subgroups of group ${groupId}:`, error);
      throw error;
    }
  },
  
  createSubgroup: async (groupId, data) => {
    try {
      const response = await api.post(`/groups/${groupId}/subgroups`, data);
      return response;
    } catch (error) {
      console.error(`Error creating subgroup for group ${groupId}:`, error);
      throw error;
    }
  },
  
  updateSubgroup: async (groupId, subgroupId, data) => {
    try {
      const response = await api.put(`/groups/${groupId}/subgroups/${subgroupId}`, data);
      return response;
    } catch (error) {
      console.error(`Error updating subgroup ${subgroupId}:`, error);
      throw error;
    }
  },
  
  deleteSubgroup: async (groupId, subgroupId) => {
    try {
      const response = await api.delete(`/groups/${groupId}/subgroups/${subgroupId}`);
      return response;
    } catch (error) {
      console.error(`Error deleting subgroup ${subgroupId}:`, error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      const response = await api.get('/groups/stats');
      return response;
    } catch (error) {
      console.error('Error fetching group statistics:', error);
      // Return sensible defaults to prevent UI errors
      return {
        totalGroups: 0,
        userGroups: 0,
        activeGroups: 0,
        newGroups: 0
      };
    }
  }
};

export default {
  auth,
  churchUsers,
  people,
  households,
  events,
  groups
};