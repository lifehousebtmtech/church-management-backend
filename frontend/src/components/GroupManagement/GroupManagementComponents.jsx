import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// GroupList component
export const GroupList = ({ groups, selectedGroupId, onSelectGroup, isLoading }) => {
  if (isLoading && (!groups || groups.length === 0)) {
    return (
      <div className="group-list">
        <h2>Groups</h2>
        <div className="loading-indicator">Loading groups...</div>
      </div>
    );
  }

  return (
    <div className="group-list">
      <h2>Groups</h2>
      {(!groups || groups.length === 0) ? (
        <div className="empty-list">No groups found.</div>
      ) : (
        <ul style={{
          listStyle: 'none',
          padding: '0',
          margin: '0'
        }}>
          {groups.map(group => (
            <li 
              key={group._id || group.id} 
              className={selectedGroupId === (group._id || group.id) ? 'selected' : ''}
              onClick={() => onSelectGroup(group)}
              style={{
                padding: '10px 15px',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                marginBottom: '8px',
                backgroundColor: selectedGroupId === (group._id || group.id) ? '#e3f2fd' : 'white',
                borderLeft: selectedGroupId === (group._id || group.id) ? '3px solid #2196f3' : 'none'
              }}>
              <div className="group-item">
                <span className="group-name">{group.name}</span>
                <span className="group-members-count">
                  {group.memberCount || group.members?.length || 0} members
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// GroupDetails component
export const GroupDetails = ({ group, onUpdateGroup, onDeleteGroup, isLoading }) => {
  const { user } = useAuth();
  const [showSubgroupForm, setShowSubgroupForm] = useState(false);
  
  if (isLoading || !group) {
    return <div className="loading-indicator">Loading group details...</div>;
  }

  const handleAddSubgroup = () => {
    setShowSubgroupForm(true);
  };

  const handleSubgroupFormCancel = () => {
    setShowSubgroupForm(false);
  };

  const handleSubgroupSubmit = (subgroupData) => {
    // Call API to create subgroup
    // Then refresh group data
    setShowSubgroupForm(false);
  };

  return (
    <div className="group-details" style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div className="group-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h2 style={{ margin: 0 }}>{group.name}</h2>
        
        {user && user.role === 'admin' && (
          <div className="group-actions" style={{
            display: 'flex',
            gap: '10px'
          }}>
            {onUpdateGroup && (
              <button 
                onClick={() => onUpdateGroup(group)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Edit
              </button>
            )}
            {onDeleteGroup && (
              <button 
                onClick={() => onDeleteGroup(group._id || group.id)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#ffebee',
                  border: '1px solid #ffcdd2',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
      
      {group.description && (
        <div className="group-description" style={{
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0 }}>{group.description}</p>
        </div>
      )}
      
      <div className="group-info" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px'
      }}>
        <div className="info-item">
          <div className="label" style={{ fontWeight: 'bold', marginBottom: '5px' }}>Members</div>
          <div className="value">{group.memberCount || group.members?.length || 0}</div>
        </div>
        
        <div className="info-item">
          <div className="label" style={{ fontWeight: 'bold', marginBottom: '5px' }}>Created</div>
          <div className="value">{new Date(group.createdAt || Date.now()).toLocaleDateString()}</div>
        </div>
        
        {group.meetingDay && (
          <div className="info-item">
            <div className="label" style={{ fontWeight: 'bold', marginBottom: '5px' }}>Meeting Day</div>
            <div className="value">{group.meetingDay}</div>
          </div>
        )}
        
        {group.meetingTime && (
          <div className="info-item">
            <div className="label" style={{ fontWeight: 'bold', marginBottom: '5px' }}>Meeting Time</div>
            <div className="value">{group.meetingTime}</div>
          </div>
        )}
      </div>
      
      {/* Leaders section */}
      <div className="leaders-section" style={{
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Group Leaders</h3>
        {(!group.leaders || group.leaders.length === 0) ? (
          <p>No leaders assigned</p>
        ) : (
          <ul style={{ paddingLeft: '20px' }}>
            {group.leaders.map(leader => (
              <li key={leader._id}>
                {leader.firstName} {leader.lastName}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Subgroups section */}
      <div className="subgroups-section" style={{
        marginBottom: '20px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <h3 style={{ fontSize: '18px', margin: 0 }}>Subgroups</h3>
          {user && user.role === 'admin' && !showSubgroupForm && (
            <button 
              onClick={handleAddSubgroup}
              style={{
                padding: '5px 10px',
                backgroundColor: '#e8f5e9',
                border: '1px solid #c8e6c9',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Subgroup
            </button>
          )}
        </div>
        
        {showSubgroupForm ? (
          <SubgroupForm 
            groupId={group._id || group.id}
            onSubmit={handleSubgroupSubmit}
            onCancel={handleSubgroupFormCancel}
          />
        ) : (
          <>
            {(!group.subgroups || group.subgroups.length === 0) ? (
              <p>No subgroups found</p>
            ) : (
              <ul style={{
                listStyle: 'none',
                padding: '0',
                margin: '0'
              }}>
                {group.subgroups.map(subgroup => (
                  <li key={subgroup._id || subgroup.id} style={{
                    padding: '10px',
                    marginBottom: '8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{subgroup.name}</span>
                      {user && user.role === 'admin' && (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button style={{
                            padding: '3px 6px',
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}>
                            Edit
                          </button>
                          <button style={{
                            padding: '3px 6px',
                            backgroundColor: '#ffebee',
                            border: '1px solid #ffcdd2',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    {subgroup.description && (
                      <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>{subgroup.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// GroupForm component
export const GroupForm = ({ onSubmit, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [leaders, setLeaders] = useState(initialData?.leaders || []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [availableLeaders, setAvailableLeaders] = useState([]);
  
  useEffect(() => {
    // Fetch available church users to be leaders
    const fetchChurchUsers = async () => {
      try {
        const users = await api.churchUsers.getAll();
        setAvailableLeaders(users);
      } catch (error) {
        console.error('Failed to fetch church users:', error);
      }
    };
    
    if (isFormOpen) {
      fetchChurchUsers();
    }
  }, [isFormOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!name.trim()) {
      alert('Group name is required');
      return;
    }
    
    onSubmit({ 
      name, 
      description,
      leaders
    });
    
    // Reset form
    setName('');
    setDescription('');
    setLeaders([]);
    setIsFormOpen(false);
  };

  return (
    <div className="group-form-container" style={{
      marginBottom: '20px'
    }}>
      {!isFormOpen ? (
        <button 
          className="create-group-button"
          onClick={() => setIsFormOpen(true)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          + Create New Group
        </button>
      ) : (
        <form className="group-form" onSubmit={handleSubmit} style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            marginTop: '0',
            marginBottom: '20px',
            fontSize: '18px'
          }}>Create New Group</h2>
          
          <div className="form-group" style={{
            marginBottom: '15px'
          }}>
            <label htmlFor="name" style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500'
            }}>Group Name *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter group name"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div className="form-group" style={{
            marginBottom: '15px'
          }}>
            <label htmlFor="description" style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500'
            }}>Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
              rows="3"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>
          
          <div className="form-group" style={{
            marginBottom: '15px'
          }}>
            <label htmlFor="leaders" style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500'
            }}>Group Leaders</label>
            <select
              id="leaders"
              multiple
              value={leaders}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                setLeaders(selectedOptions);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                minHeight: '100px'
              }}
            >
              {availableLeaders.map(user => (
                <option key={user._id} value={user._id}>
                  {user.person ? `${user.person.firstName} ${user.person.lastName}` : user.username}
                </option>
              ))}
            </select>
            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
              Hold Ctrl/Cmd to select multiple leaders
            </small>
          </div>
          
          <div className="form-actions" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px'
          }}>
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => setIsFormOpen(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button type="submit" className="submit-button" style={{
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Create Group
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// SubgroupForm component
export const SubgroupForm = ({ groupId, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leaders, setLeaders] = useState([]);
  const [availableLeaders, setAvailableLeaders] = useState([]);
  
  useEffect(() => {
    // Fetch available church users to be leaders
    const fetchChurchUsers = async () => {
      try {
        const users = await api.churchUsers.getAll();
        setAvailableLeaders(users);
      } catch (error) {
        console.error('Failed to fetch church users:', error);
      }
    };
    
    fetchChurchUsers();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!name.trim()) {
      alert('Subgroup name is required');
      return;
    }
    
    onSubmit({ 
      name, 
      description,
      leaders,
      parentGroup: groupId
    });
  };

  return (
    <form className="subgroup-form" onSubmit={handleSubmit} style={{
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '15px'
    }}>
      <h3 style={{
        marginTop: '0',
        marginBottom: '15px',
        fontSize: '16px'
      }}>Create New Subgroup</h3>
      
      <div className="form-group" style={{
        marginBottom: '12px'
      }}>
        <label htmlFor="subgroup-name" style={{
          display: 'block',
          marginBottom: '5px',
          fontWeight: '500'
        }}>Subgroup Name *</label>
        <input
          id="subgroup-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Enter subgroup name"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>
      
      <div className="form-group" style={{
        marginBottom: '12px'
      }}>
        <label htmlFor="subgroup-description" style={{
          display: 'block',
          marginBottom: '5px',
          fontWeight: '500'
        }}>Description</label>
        <textarea
          id="subgroup-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter subgroup description"
          rows="2"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
      </div>
      
      <div className="form-group" style={{
        marginBottom: '12px'
      }}>
        <label htmlFor="subgroup-leaders" style={{
          display: 'block',
          marginBottom: '5px',
          fontWeight: '500'
        }}>Subgroup Leaders</label>
        <select
          id="subgroup-leaders"
          multiple
          value={leaders}
          onChange={(e) => {
            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
            setLeaders(selectedOptions);
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            minHeight: '80px'
          }}
        >
          {availableLeaders.map(user => (
            <option key={user._id} value={user._id}>
              {user.person ? `${user.person.firstName} ${user.person.lastName}` : user.username}
            </option>
          ))}
        </select>
        <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
          Hold Ctrl/Cmd to select multiple leaders
        </small>
      </div>
      
      <div className="form-actions" style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '15px'
      }}>
        <button 
          type="button" 
          className="cancel-button"
          onClick={onCancel}
          style={{
            padding: '6px 12px',
            backgroundColor: 'transparent',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Cancel
        </button>
        <button type="submit" className="submit-button" style={{
          padding: '6px 12px',
          backgroundColor: '#4caf50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          Create Subgroup
        </button>
      </div>
    </form>
  );
};

// Main GroupManagement component - combines the above components
const GroupManagement = () => {
  const { 
    user, 
    userGroups, 
    fetchUserGroups, 
    createGroup, 
    updateGroup,
    deleteGroup,
    fetchGroup,
    currentGroup, 
    setCurrentGroup,
    groupLoading,
    error
  } = useAuth();
  
  const [activeView, setActiveView] = useState('list'); // list, details
  
  useEffect(() => {
    // Fetch user's groups if not already loaded
    if (user && (!userGroups || userGroups.length === 0)) {
      fetchUserGroups();
    }
  }, [user, userGroups, fetchUserGroups]);

  const handleSelectGroup = (group) => {
    fetchGroup(group._id || group.id);
    setActiveView('details');
  };

  const handleCreateGroup = async (groupData) => {
    const newGroup = await createGroup(groupData);
    if (newGroup) {
      handleSelectGroup(newGroup);
    }
  };

  const handleUpdateGroup = async (updatedGroup) => {
    await updateGroup(updatedGroup._id || updatedGroup.id, updatedGroup);
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this group?') && await deleteGroup(groupId)) {
      setActiveView('list');
    }
  };

  const handleBackToList = () => {
    setCurrentGroup(null);
    setActiveView('list');
  };

  return (
    <div className="group-management" style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {error && <div className="error-message" style={{
        padding: '10px',
        backgroundColor: '#ffdddd',
        borderLeft: '5px solid #f44336',
        marginBottom: '15px'
      }}>{error}</div>}
      
      {activeView === 'list' ? (
        <>
          <GroupForm onSubmit={handleCreateGroup} />
          <GroupList 
            groups={userGroups} 
            selectedGroupId={currentGroup?._id || currentGroup?.id}
            onSelectGroup={handleSelectGroup}
            isLoading={groupLoading}
          />
        </>
      ) : (
        <>
          <button className="back-button" style={{
            padding: '8px 16px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }} onClick={handleBackToList}>
            &larr; Back to Groups
          </button>
          
          {currentGroup && (
            <GroupDetails 
              group={currentGroup}
              onUpdateGroup={handleUpdateGroup}
              onDeleteGroup={handleDeleteGroup}
              isLoading={groupLoading}
            />
          )}
        </>
      )}
    </div>
  );
};

// Export both individual components and the combined component
export default GroupManagement;