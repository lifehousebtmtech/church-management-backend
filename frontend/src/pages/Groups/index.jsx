import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const GroupsIndex = () => {
  const navigate = useNavigate();
  const { 
    user, 
    groupStats, 
    userGroups, 
    fetchGroupStats, 
    fetchUserGroups, 
    groupLoading, 
    error 
  } = useAuth();
  
  useEffect(() => {
    fetchGroupStats();
    fetchUserGroups();
  }, [fetchGroupStats, fetchUserGroups]);

  const navigateToDashboard = () => {
    navigate('/groups/dashboard');
  };

  return (
    <div className="groups-index" style={{
      padding: '20px',
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      <div className="groups-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ margin: 0 }}>Groups</h1>
        <button 
          className="dashboard-button"
          onClick={navigateToDashboard}
          style={{
            padding: '10px 16px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go to Dashboard
        </button>
      </div>

      {groupLoading ? (
        <div className="loading" style={{
          padding: '30px',
          textAlign: 'center',
          color: '#757575'
        }}>Loading group statistics...</div>
      ) : (
        <div className="stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div className="stat-card" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div className="stat-title" style={{
              fontSize: '14px',
              color: '#757575',
              marginBottom: '5px'
            }}>Your Groups</div>
            <div className="stat-value" style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '15px'
            }}>{groupStats.userGroups}</div>
            <div className="stat-action" style={{
              marginTop: '10px'
            }}>
              <Link to="/groups/dashboard?tab=myGroups" style={{
                color: '#2196f3',
                textDecoration: 'none'
              }}>
                View Your Groups
              </Link>
            </div>
          </div>
          
          <div className="stat-card" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div className="stat-title" style={{
              fontSize: '14px',
              color: '#757575',
              marginBottom: '5px'
            }}>Total Groups</div>
            <div className="stat-value" style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '15px'
            }}>{groupStats.totalGroups}</div>
            <div className="stat-action" style={{
              marginTop: '10px'
            }}>
              <Link to="/groups/dashboard?tab=explore" style={{
                color: '#2196f3',
                textDecoration: 'none'
              }}>
                Explore Groups
              </Link>
            </div>
          </div>
          
          <div className="stat-card" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div className="stat-title" style={{
              fontSize: '14px',
              color: '#757575',
              marginBottom: '5px'
            }}>Active Groups</div>
            <div className="stat-value" style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '15px'
            }}>{groupStats.activeGroups}</div>
            <div className="stat-description" style={{
              fontSize: '14px',
              color: '#757575'
            }}>
              Groups with activity in the last 7 days
            </div>
          </div>
          
          <div className="stat-card" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div className="stat-title" style={{
              fontSize: '14px',
              color: '#757575',
              marginBottom: '5px'
            }}>New Groups</div>
            <div className="stat-value" style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '15px'
            }}>{groupStats.newGroups}</div>
            <div className="stat-description" style={{
              fontSize: '14px',
              color: '#757575'
            }}>
              Created in the last 30 days
            </div>
          </div>
        </div>
      )}

      {userGroups && userGroups.length > 0 && (
        <div className="recent-activity" style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{
            fontSize: '18px',
            marginTop: 0,
            marginBottom: '15px'
          }}>Recent Group Activity</h2>
          {/* Activity feed would go here */}
          <div className="view-all-link" style={{
            marginTop: '15px',
            textAlign: 'right'
          }}>
            <Link to="/groups/dashboard" style={{
              color: '#2196f3',
              textDecoration: 'none'
            }}>
              View All Activity
            </Link>
          </div>
        </div>
      )}

      {(!userGroups || userGroups.length === 0) && !groupLoading && (
        <div className="empty-state" style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '40px 20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '18px',
            marginTop: 0,
            marginBottom: '10px'
          }}>You're not a member of any groups yet</h2>
          <p style={{
            color: '#757575',
            marginBottom: '20px'
          }}>Join groups to collaborate with others</p>
          <button 
            className="explore-button"
            onClick={() => navigate('/groups/dashboard?tab=explore')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Explore Groups
          </button>
        </div>
      )}

      {error && (
        <div className="error-message" style={{
          padding: '15px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Admin quick access button */}
      {user && user.role === 'admin' && (
        <div className="admin-actions" style={{
          marginTop: '30px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={() => navigate('/groups/admin')}
            style={{
              padding: '10px 16px',
              backgroundColor: '#ff5722',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Group Administration
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupsIndex;