// frontend/src/services/group.js
import api from './api';
import authService from './auth';

const groupService = {
  // Get all groups with optional filtering
  getAllGroups: async (filters = {}) => {
    try {
      return await api.groups.getAll(filters);
    } catch (error) {
      console.error('Error in getAllGroups:', error);
      throw error;
    }
  },

  // Get groups the current user is a member of
  getUserGroups: async () => {
    try {
      return await api.groups.getUserGroups();
    } catch (error) {
      console.error('Error in getUserGroups:', error);
      throw error;
    }
  },

  // Get groups for admin management
  getAdminGroups: async () => {
    try {
      return await api.groups.getAdminGroups();
    } catch (error) {
      console.error('Error in getAdminGroups:', error);
      throw error;
    }
  },

  // Get a specific group by ID with permission check
  getGroup: async (id, currentUser) => {
    try {
      const group = await api.groups.getOne(id);
      
      // Check if user has permission to view
      if (!authService.hasGroupPermission('view', group, currentUser)) {
        throw new Error('You do not have permission to view this group');
      }
      
      return group;
    } catch (error) {
      console.error(`Error in getGroup (${id}):`, error);
      throw error;
    }
  },

  // Create a new group
  createGroup: async (data) => {
    try {
      return await api.groups.create(data);
    } catch (error) {
      console.error('Error in createGroup:', error);
      throw error;
    }
  },

  // Update an existing group with permission check
  updateGroup: async (id, data, currentUser) => {
    try {
      // First get the group to check permissions
      const group = await api.groups.getOne(id);
      
      // Check if user has permission to edit
      if (!authService.hasGroupPermission('edit', group, currentUser)) {
        throw new Error('You do not have permission to edit this group');
      }
      
      return await api.groups.update(id, data);
    } catch (error) {
      console.error(`Error in updateGroup (${id}):`, error);
      throw error;
    }
  },

  // Delete a group with permission check
  deleteGroup: async (id, currentUser) => {
    try {
      // First get the group to check permissions
      const group = await api.groups.getOne(id);
      
      // Check if user has permission to delete
      if (!authService.hasGroupPermission('delete', group, currentUser)) {
        throw new Error('You do not have permission to delete this group');
      }
      
      return await api.groups.delete(id);
    } catch (error) {
      console.error(`Error in deleteGroup (${id}):`, error);
      throw error;
    }
  },

  // Group member operations
  members: {
    // Get all members of a group
    getMembers: async (groupId) => {
      try {
        return await api.groups.getMembers(groupId);
      } catch (error) {
        console.error(`Error in getMembers (${groupId}):`, error);
        throw error;
      }
    },

    // Add a member to a group with permission check
    addMember: async (groupId, memberId, role, currentUser) => {
      try {
        // First get the group to check permissions
        const group = await api.groups.getOne(groupId);
        
        // Check if user has permission to add members
        if (!authService.hasGroupPermission('addMember', group, currentUser)) {
          throw new Error('You do not have permission to add members to this group');
        }
        
        return await api.groups.addMember(groupId, memberId, role);
      } catch (error) {
        console.error(`Error in addMember (${groupId}, ${memberId}):`, error);
        throw error;
      }
    },

    // Remove a member from a group with permission check
    removeMember: async (groupId, memberId, currentUser) => {
      try {
        // First get the group to check permissions
        const group = await api.groups.getOne(groupId);
        
        // Check if user has permission to remove members
        if (!authService.hasGroupPermission('removeMember', group, currentUser)) {
          throw new Error('You do not have permission to remove members from this group');
        }
        
        return await api.groups.removeMember(groupId, memberId);
      } catch (error) {
        console.error(`Error in removeMember (${groupId}, ${memberId}):`, error);
        throw error;
      }
    }
  },

  // Subgroup operations
  subgroups: {
    // Get all subgroups for a group
    getSubgroups: async (groupId) => {
      try {
        return await api.groups.getSubgroups(groupId);
      } catch (error) {
        console.error(`Error in getSubgroups (${groupId}):`, error);
        throw error;
      }
    },

    // Create a new subgroup with permission check
    createSubgroup: async (groupId, data, currentUser) => {
      try {
        // First get the parent group to check permissions
        const group = await api.groups.getOne(groupId);
        
        // Check if user has permission to create subgroups
        if (!authService.hasGroupPermission('createSubgroup', group, currentUser)) {
          throw new Error('You do not have permission to create subgroups');
        }
        
        return await api.groups.createSubgroup(groupId, data);
      } catch (error) {
        console.error(`Error in createSubgroup (${groupId}):`, error);
        throw error;
      }
    },

    // Update a subgroup with permission check
    updateSubgroup: async (groupId, subgroupId, data, currentUser) => {
      try {
        // First get the parent group to check permissions
        const group = await api.groups.getOne(groupId);
        
        // Check if user has permission to edit
        if (!authService.hasGroupPermission('edit', group, currentUser)) {
          throw new Error('You do not have permission to update this subgroup');
        }
        
        return await api.groups.updateSubgroup(groupId, subgroupId, data);
      } catch (error) {
        console.error(`Error in updateSubgroup (${groupId}, ${subgroupId}):`, error);
        throw error;
      }
    },

    // Delete a subgroup with permission check
    deleteSubgroup: async (groupId, subgroupId, currentUser) => {
      try {
        // First get the parent group to check permissions
        const group = await api.groups.getOne(groupId);
        
        // Check if user has permission to delete
        if (!authService.hasGroupPermission('delete', group, currentUser)) {
          throw new Error('You do not have permission to delete this subgroup');
        }
        
        return await api.groups.deleteSubgroup(groupId, subgroupId);
      } catch (error) {
        console.error(`Error in deleteSubgroup (${groupId}, ${subgroupId}):`, error);
        throw error;
      }
    }
  },

  // Get group statistics
  getGroupStats: async () => {
    try {
      return await api.groups.getStats();
    } catch (error) {
      console.error('Error in getGroupStats:', error);
      throw error;
    }
  },

  // Format group data for display
  formatGroupData: (group) => {
    if (!group) return null;

    return {
      ...group,
      memberCount: group.members?.length || 0,
      createdAt: group.createdAt ? new Date(group.createdAt) : null,
      updatedAt: group.updatedAt ? new Date(group.updatedAt) : null,
      // Add additional formatted fields as needed
    };
  },

  // Utility function to determine if user is a member of a group
  isGroupMember: (group, userId) => {
    if (!group || !group.members || !userId) return false;
    return group.members.some(member => member.userId === userId);
  },

  // Utility function to get user's role in a group
  getUserGroupRole: (group, userId) => {
    if (!group || !group.members || !userId) return null;
    const membership = group.members.find(member => member.userId === userId);
    return membership ? membership.role : null;
  }
};

export default groupService;