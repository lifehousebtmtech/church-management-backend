import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import groupService from '../services/group';

const AuthContext = createContext(null);

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupLoading, setGroupLoading] = useState(false);
  const [error, setError] = useState(null);
  const idleTimerRef = useRef(null);
  const navigate = useNavigate();

  // Group-related state
  const [userGroups, setUserGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [currentSubgroup, setCurrentSubgroup] = useState(null);
  const [groupStats, setGroupStats] = useState({
    totalGroups: 0,
    userGroups: 0,
    activeGroups: 0,
    newGroups: 0
  });

  const logout = useCallback(() => {
    setUser(null);
    setUserGroups([]);
    setCurrentGroup(null);
    setCurrentSubgroup(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    navigate('/login');
  }, [navigate]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      logout();
    }, IDLE_TIMEOUT);
  }, [logout]);

  // Setup event listeners for user activity
  useEffect(() => {
    if (user) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      const handleUserActivity = () => {
        resetIdleTimer();
      };

      events.forEach(event => {
        document.addEventListener(event, handleUserActivity);
      });

      resetIdleTimer();

      return () => {
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
        }
        events.forEach(event => {
          document.removeEventListener(event, handleUserActivity);
        });
      };
    }
  }, [user, resetIdleTimer]);

  // Initial auth check
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      const response = await api.auth.login({ username, password });
      const userData = response.data ? response.data.user : response.user;
      const token = response.data ? response.data.token : response.token;
      
      // Add _id if it's not included
      if (userData && !userData._id && response._id) {
        userData._id = response._id;
      }
      
      setUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      resetIdleTimer();
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Permission check function
  const checkPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admins have all permissions
    return user.permissions?.includes(permission) ?? false;
  };

  // Group-related functions
  
  // Fetch user's groups
  const fetchUserGroups = useCallback(async () => {
    if (!user) return;
    
    setGroupLoading(true);
    try {
      const groups = await groupService.getUserGroups();
      setUserGroups(groups);
      setError(null);
    } catch (err) {
      setError('Failed to fetch your groups');
      console.error('Error fetching user groups:', err);
    } finally {
      setGroupLoading(false);
    }
  }, [user]);

  // Fetch all groups (for admin or explore view)
  const fetchAllGroups = useCallback(async (filters = {}) => {
    setGroupLoading(true);
    try {
      const groups = await groupService.getAllGroups(filters);
      setAllGroups(groups);
      setError(null);
    } catch (err) {
      setError('Failed to fetch groups');
      console.error('Error fetching all groups:', err);
    } finally {
      setGroupLoading(false);
    }
  }, []);

  // Fetch group statistics
  const fetchGroupStats = useCallback(async () => {
    try {
      const stats = await groupService.getGroupStats();
      setGroupStats(stats);
    } catch (err) {
      console.error('Error fetching group stats:', err);
    }
  }, []);

  // Get a specific group
  const fetchGroup = useCallback(async (groupId) => {
    setGroupLoading(true);
    try {
      const group = await groupService.getGroup(groupId, user);
      setCurrentGroup(group);
      setError(null);
      return group;
    } catch (err) {
      setError('Failed to fetch group details');
      console.error(`Error fetching group ${groupId}:`, err);
      return null;
    } finally {
      setGroupLoading(false);
    }
  }, [user]);

  // Create a new group
  const createGroup = useCallback(async (groupData) => {
    setGroupLoading(true);
    try {
      const newGroup = await groupService.createGroup(groupData);
      // Update groups list
      setAllGroups(prevGroups => [...prevGroups, newGroup]);
      setUserGroups(prevGroups => [...prevGroups, newGroup]);
      setError(null);
      return newGroup;
    } catch (err) {
      setError('Failed to create group');
      console.error('Error creating group:', err);
      return null;
    } finally {
      setGroupLoading(false);
    }
  }, []);

  // Update an existing group
  const updateGroup = useCallback(async (groupId, groupData) => {
    setGroupLoading(true);
    try {
      const updatedGroup = await groupService.updateGroup(groupId, groupData, user);
      
      // Update groups lists
      setAllGroups(prevGroups => 
        prevGroups.map(group => group._id === updatedGroup._id ? updatedGroup : group)
      );
      
      setUserGroups(prevGroups => 
        prevGroups.map(group => group._id === updatedGroup._id ? updatedGroup : group)
      );
      
      // Update current group if it's the one being updated
      if (currentGroup && currentGroup._id === updatedGroup._id) {
        setCurrentGroup(updatedGroup);
      }
      
      setError(null);
      return updatedGroup;
    } catch (err) {
      setError('Failed to update group');
      console.error(`Error updating group ${groupId}:`, err);
      return null;
    } finally {
      setGroupLoading(false);
    }
  }, [currentGroup, user]);

  // Delete a group
  const deleteGroup = useCallback(async (groupId) => {
    setGroupLoading(true);
    try {
      await groupService.deleteGroup(groupId, user);
      
      // Update groups lists
      setAllGroups(prevGroups => prevGroups.filter(group => group._id !== groupId));
      setUserGroups(prevGroups => prevGroups.filter(group => group._id !== groupId));
      
      // Clear current group if it's the one being deleted
      if (currentGroup && currentGroup._id === groupId) {
        setCurrentGroup(null);
      }
      
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to delete group');
      console.error(`Error deleting group ${groupId}:`, err);
      return false;
    } finally {
      setGroupLoading(false);
    }
  }, [currentGroup, user]);

  // Join a group
  const joinGroup = useCallback(async (groupId) => {
    if (!user) return false;
    
    setGroupLoading(true);
    try {
      const updatedGroup = await groupService.members.addMember(groupId, user._id, 'member');
      
      // Update groups lists
      fetchUserGroups(); // Refresh user groups
      
      setAllGroups(prevGroups => 
        prevGroups.map(group => group._id === updatedGroup._id ? updatedGroup : group)
      );
      
      // Update current group if it's the one being joined
      if (currentGroup && currentGroup._id === updatedGroup._id) {
        setCurrentGroup(updatedGroup);
      }
      
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to join group');
      console.error(`Error joining group ${groupId}:`, err);
      return false;
    } finally {
      setGroupLoading(false);
    }
  }, [currentGroup, fetchUserGroups, user]);

  // Leave a group
  const leaveGroup = useCallback(async (groupId) => {
    if (!user) return false;
    
    setGroupLoading(true);
    try {
      await groupService.members.removeMember(groupId, user._id);
      
      // Update groups lists
      fetchUserGroups(); // Refresh user groups
      
      // Update current group
      if (currentGroup && currentGroup._id === groupId) {
        const updatedGroup = await groupService.getGroup(groupId, user);
        setCurrentGroup(updatedGroup);
      }
      
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to leave group');
      console.error(`Error leaving group ${groupId}:`, err);
      return false;
    } finally {
      setGroupLoading(false);
    }
  }, [currentGroup, fetchUserGroups, user]);

  // Group member operations
  const getGroupMembers = useCallback(async (groupId) => {
    try {
      return await groupService.members.getMembers(groupId);
    } catch (err) {
      console.error(`Error fetching members for group ${groupId}:`, err);
      return [];
    }
  }, []);

  const addGroupMember = useCallback(async (groupId, memberId, role = 'member') => {
    try {
      const result = await groupService.members.addMember(groupId, memberId, role, user);
      
      // Update current group if needed
      if (currentGroup && currentGroup._id === groupId) {
        fetchGroup(groupId);
      }
      
      return result;
    } catch (err) {
      console.error(`Error adding member to group ${groupId}:`, err);
      throw err;
    }
  }, [currentGroup, fetchGroup, user]);

  const removeGroupMember = useCallback(async (groupId, memberId) => {
    try {
      const result = await groupService.members.removeMember(groupId, memberId, user);
      
      // Update current group if needed
      if (currentGroup && currentGroup._id === groupId) {
        fetchGroup(groupId);
      }
      
      return result;
    } catch (err) {
      console.error(`Error removing member from group ${groupId}:`, err);
      throw err;
    }
  }, [currentGroup, fetchGroup, user]);

  // Subgroup operations
  const getSubgroups = useCallback(async (groupId) => {
    try {
      return await groupService.subgroups.getSubgroups(groupId);
    } catch (err) {
      console.error(`Error fetching subgroups for group ${groupId}:`, err);
      return [];
    }
  }, []);

  const createSubgroup = useCallback(async (groupId, subgroupData) => {
    try {
      const newSubgroup = await groupService.subgroups.createSubgroup(groupId, subgroupData, user);
      
      // Update current group if needed
      if (currentGroup && currentGroup._id === groupId) {
        fetchGroup(groupId);
      }
      
      return newSubgroup;
    } catch (err) {
      console.error(`Error creating subgroup for group ${groupId}:`, err);
      throw err;
    }
  }, [currentGroup, fetchGroup, user]);

  const updateSubgroup = useCallback(async (groupId, subgroupId, subgroupData) => {
    try {
      const updatedSubgroup = await groupService.subgroups.updateSubgroup(
        groupId, 
        subgroupId, 
        subgroupData,
        user
      );
      
      // Update current subgroup if it's the one being updated
      if (currentSubgroup && currentSubgroup._id === subgroupId) {
        setCurrentSubgroup(updatedSubgroup);
      }
      
      // Update current group if needed
      if (currentGroup && currentGroup._id === groupId) {
        fetchGroup(groupId);
      }
      
      return updatedSubgroup;
    } catch (err) {
      console.error(`Error updating subgroup ${subgroupId}:`, err);
      throw err;
    }
  }, [currentGroup, currentSubgroup, fetchGroup, user]);

  const deleteSubgroup = useCallback(async (groupId, subgroupId) => {
    try {
      await groupService.subgroups.deleteSubgroup(groupId, subgroupId, user);
      
      // Clear current subgroup if it's the one being deleted
      if (currentSubgroup && currentSubgroup._id === subgroupId) {
        setCurrentSubgroup(null);
      }
      
      // Update current group if needed
      if (currentGroup && currentGroup._id === groupId) {
        fetchGroup(groupId);
      }
      
      return true;
    } catch (err) {
      console.error(`Error deleting subgroup ${subgroupId}:`, err);
      throw err;
    }
  }, [currentGroup, currentSubgroup, fetchGroup, user]);

  // Helper function to check if user is a member of a group
  const isGroupMember = useCallback((group) => {
    if (!user || !group || !group.members) return false;
    return group.members.some(member => member.userId === user._id);
  }, [user]);

  // Helper function to get user's role in a group
  const getUserGroupRole = useCallback((group) => {
    if (!user || !group || !group.members) return null;
    const membership = group.members.find(member => member.userId === user._id);
    return membership ? membership.role : null;
  }, [user]);

  // Load user groups on initial render and when user changes
  useEffect(() => {
    if (user) {
      fetchUserGroups();
      fetchGroupStats();
    }
  }, [fetchUserGroups, fetchGroupStats, user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      // Auth-related values
      user, 
      login, 
      logout, 
      checkPermission,
      
      // Group-related values
      userGroups,
      allGroups,
      currentGroup,
      currentSubgroup,
      groupLoading,
      error,
      groupStats,
      
      // Group operations
      fetchUserGroups,
      fetchAllGroups,
      fetchGroupStats,
      fetchGroup,
      createGroup,
      updateGroup,
      deleteGroup,
      joinGroup,
      leaveGroup,
      
      // Group member operations
      getGroupMembers,
      addGroupMember,
      removeGroupMember,
      
      // Subgroup operations
      getSubgroups,
      createSubgroup,
      updateSubgroup,
      deleteSubgroup,
      setCurrentSubgroup,
      
      // Helper functions
      isGroupMember,
      getUserGroupRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};