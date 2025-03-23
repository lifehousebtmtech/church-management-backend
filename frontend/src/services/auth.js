// frontend/src/services/auth.js
import axios from 'axios';

const API_URL = '/api/auth';

const authService = {
  login: async (username, password) => {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    return response.data;
  },

  logout: async () => {
    localStorage.removeItem('token');
  },

  // Group permission checks
  hasGroupPermission: (permission, group, user) => {
    if (!user || !group) return false;
    
    // Admin users have all permissions
    if (user.role === 'admin') return true;
    
    // Check if user is a group admin
    if (group.members) {
      const membership = group.members.find(m => m.userId === user._id);
      if (membership && membership.role === 'admin') return true;
    }
    
    // Permission specific checks
    switch (permission) {
      case 'view':
        // Public groups can be viewed by anyone
        if (group.visibilityType === 'public') return true;
        // Restricted groups require membership
        if (group.visibilityType === 'restricted') {
          return group.members && group.members.some(m => m.userId === user._id);
        }
        // Private groups require explicit membership
        return group.members && group.members.some(m => m.userId === user._id);
        
      case 'edit':
        // Only group admins or moderators can edit
        return group.members && group.members.some(m => 
          m.userId === user._id && ['admin', 'moderator'].includes(m.role)
        );
        
      case 'delete':
        // Only group admins can delete
        return group.members && group.members.some(m => 
          m.userId === user._id && m.role === 'admin'
        );
        
      case 'addMember':
        // Admins and moderators can add members
        return group.members && group.members.some(m => 
          m.userId === user._id && ['admin', 'moderator'].includes(m.role)
        );
        
      case 'removeMember':
        // Admins and moderators can remove members
        return group.members && group.members.some(m => 
          m.userId === user._id && ['admin', 'moderator'].includes(m.role)
        );
        
      case 'createSubgroup':
        // Admins and moderators can create subgroups
        return group.members && group.members.some(m => 
          m.userId === user._id && ['admin', 'moderator'].includes(m.role)
        );
        
      default:
        return false;
    }
  },
  
  // Check if user can manage groups at admin level
  canManageGroups: (user) => {
    if (!user) return false;
    
    // Only admin or group_manager roles can manage all groups
    return ['admin', 'group_manager'].includes(user.role);
  }
};

export default authService;