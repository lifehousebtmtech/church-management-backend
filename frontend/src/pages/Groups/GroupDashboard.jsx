import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  GroupList, 
  GroupDetails 
} from '../../components/GroupManagement/GroupManagementComponents';

const GroupDashboard = () => {
  const { 
    userGroups, 
    allGroups,
    fetchUserGroups, 
    fetchAllGroups,
    fetchGroup,
    currentGroup,
    setCurrentGroup,
    joinGroup,
    leaveGroup,
    groupLoading,
    error 
  } = useAuth();
  
  const [activeSection, setActiveSection] = useState('myGroups'); // myGroups, explore

  useEffect(() => {
    // Load user's groups
    fetchUserGroups();
    
    // Load explore groups if that tab is active
    if (activeSection === 'explore') {
      fetchAllGroups({ public: true });
    }
  }, [fetchUserGroups, fetchAllGroups, activeSection]);

  const handleSelectGroup = (group) => {
    fetchGroup(group._id || group.id);
  };

  return (
    <div className="group-dashboard" style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{
        marginBottom: '20px',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>Groups Dashboard</h1>
      
      {error && <div className="error-message" style={{
        padding: '10px',
        backgroundColor: '#ffdddd',
        borderLeft: '5px solid #f44336',
        marginBottom: '15px'
      }}>{error}</div>}
      
      <div className="section-tabs" style={{
        display: 'flex',
        borderBottom: '1px solid #ddd',
        marginBottom: '20px'
      }}>
        <button 
          className={`section-tab ${activeSection === 'myGroups' ? 'active' : ''}`}
          onClick={() => setActiveSection('myGroups')}
          style={{
            padding: '10px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeSection === 'myGroups' ? '2px solid #2196f3' : 'none',
            fontWeight: activeSection === 'myGroups' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          My Groups
        </button>
        <button 
          className={`section-tab ${activeSection === 'explore' ? 'active' : ''}`}
          onClick={() => setActiveSection('explore')}
          style={{
            padding: '10px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeSection === 'explore' ? '2px solid #2196f3' : 'none',
            fontWeight: activeSection === 'explore' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          Explore Groups
        </button>
      </div>
      
      <div className="group-dashboard-content" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '20px'
      }}>
        <div className="group-sidebar">
          {activeSection === 'myGroups' ? (
            <GroupList 
              groups={userGroups} 
              selectedGroupId={currentGroup?._id || currentGroup?.id}
              onSelectGroup={handleSelectGroup}
              isLoading={groupLoading}
            />
          ) : (
            <GroupList 
              groups={allGroups} 
              selectedGroupId={currentGroup?._id || currentGroup?.id}
              onSelectGroup={handleSelectGroup}
              isLoading={groupLoading}
            />
          )}
        </div>
        
        <div className="group-main">
          {currentGroup ? (
            <div className="group-details-container">
              <GroupDetails 
                group={currentGroup}
                isLoading={groupLoading}
              />
              
              <div className="group-actions" style={{
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                {currentGroup.isMember ? (
                  <button 
                    className="leave-button"
                    onClick={() => leaveGroup(currentGroup._id || currentGroup.id)}
                    disabled={groupLoading}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#ffebee',
                      border: '1px solid #ffcdd2',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Leave Group
                  </button>
                ) : (
                  <button 
                    className="join-button"
                    onClick={() => joinGroup(currentGroup._id || currentGroup.id)}
                    disabled={groupLoading || currentGroup.joinRequested}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#e3f2fd',
                      border: '1px solid #bbdefb',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {currentGroup.joinRequested ? 'Join Requested' : 'Join Group'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection" style={{
              padding: '50px 20px',
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px'
            }}>
              <p>Select a group from the list to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDashboard;