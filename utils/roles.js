// utils/roles.js
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  EVENT_MANAGER: 'event_manager',
  TEAM_LEAD: 'team_lead',
  CHECK_IN_STAFF: 'check_in_staff',
  GROUP_LEADER: 'group_leader',
  GROUP_ADMIN: 'group_admin'
};

export const PERMISSIONS = {
  [ROLES.ADMIN]: [
    'manage_users',
    'manage_people',
    'manage_households',
    'manage_events',
    'manage_teams',
    'manage_groups',
    'manage_group_members',
    'view_people',
    'view_households',
    'view_events',
    'view_groups',
    'perform_check_in',
    'register_newcomers'
  ],
  [ROLES.EVENT_MANAGER]: [
    'manage_events',
    'manage_teams',
    'view_events',
    'view_people',
    'view_groups',
    'perform_check_in',
    'register_newcomers'
  ],
  [ROLES.TEAM_LEAD]: [
    'manage_teams',
    'view_events',
    'view_people',
    'view_groups'
  ],
  [ROLES.GROUP_LEADER]: [
    'manage_group_members',
    'view_groups',
    'view_people',
    'view_events'
  ],
  [ROLES.GROUP_ADMIN]: [
    'manage_groups',
    'manage_group_members',
    'view_groups',
    'view_people',
    'view_events'
  ],
  [ROLES.CHECK_IN_STAFF]: [
    'view_events',
    'view_groups',
    'perform_check_in',
    'register_newcomers'
  ],
  [ROLES.USER]: [
    'view_events',
    'view_groups'
  ]
};

export const hasPermission = (role, permission) => {
  return PERMISSIONS[role]?.includes(permission) || false;
};

export const canManageEvent = (user) => {
  return user.permissions.includes('manage_events');
};

export const canPerformCheckIn = (user) => {
  return user.permissions.includes('perform_check_in');
};

export const canManageTeams = (user) => {
  return user.permissions.includes('manage_teams');
};

export const canRegisterNewcomers = (user) => {
  return user.permissions.includes('register_newcomers');
};

export const canManageGroups = (user) => {
  return user.permissions.includes('manage_groups');
};

export const canManageGroupMembers = (user) => {
  return user.permissions.includes('manage_group_members');
};

export const isGroupLeader = (user, groupId) => {
  return user.groupLeaderships && user.groupLeaderships.includes(groupId);
};

export const isSubgroupLeader = (user, subgroupId) => {
  return user.subgroupLeaderships && user.subgroupLeaderships.includes(subgroupId);
};