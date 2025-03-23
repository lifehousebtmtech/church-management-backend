import React from 'react';
import { useAuth } from '../../context/AuthContext';
import GroupManagement from '../../components/GroupManagement/GroupManagementComponents';

const AdminGroupManagement = () => {
  const { 
    allGroups, 
    fetchAllGroups, 
    groupLoading, 
    error, 
    createGroup,
    updateGroup,
    deleteGroup,
    currentGroup
  } = useAuth();

  React.useEffect(() => {
    // Load all groups with admin access
    fetchAllGroups({ admin: true });
  }, [fetchAllGroups]);

  return (
    <div className="admin-group-management" style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{
        marginBottom: '20px',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>Admin Group Management</h1>
      
      <GroupManagement />
    </div>
  );
};

export default AdminGroupManagement;