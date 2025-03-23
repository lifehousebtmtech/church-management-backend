// models/churchUser.js
import mongoose from 'mongoose';

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  EVENT_MANAGER: 'event_manager',
  TEAM_LEAD: 'team_lead',
  CHECK_IN_STAFF: 'check_in_staff',
  GROUP_LEADER: 'group_leader',
  GROUP_ADMIN: 'group_admin'
};

const ROLE_PERMISSIONS = {
  admin: [
    'manage_users', 
    'manage_people', 
    'manage_households', 
    'manage_events',
    'manage_teams',
    'manage_groups',
    'view_people', 
    'view_households', 
    'view_events',
    'view_groups',
    'perform_check_in'
  ],
  event_manager: [
    'manage_events',
    'manage_teams',
    'view_events',
    'view_people',
    'perform_check_in'
  ],
  team_lead: [
    'manage_teams',
    'view_events',
    'view_people'
  ],
  group_leader: [
    'manage_group_members',
    'view_groups',
    'view_people'
  ],
  group_admin: [
    'manage_groups',
    'manage_group_members',
    'view_groups',
    'view_people'
  ],
  check_in_staff: [
    'view_events',
    'perform_check_in'
  ],
  user: ['view_events', 'view_groups']
};

const churchUserSchema = new mongoose.Schema({
  person: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.USER
  },
  permissions: [{
    type: String,
    enum: [
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
      'perform_check_in'
    ]
  }],
  teamLeaderships: [{
    type: String,
    enum: ['welcome', 'cafe', 'media']
  }],
  groupLeaderships: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  subgroupLeaderships: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subgroup'
  }]
}, {
  timestamps: true,
  collection: 'churchUsers'
});

churchUserSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    this.permissions = ROLE_PERMISSIONS[this.role] || [];
  }
  next();
});

// Method to check if user is group leader for specific group
churchUserSchema.methods.isGroupLeaderFor = function(groupId) {
  return this.groupLeaderships.some(id => id.toString() === groupId.toString());
};

// Method to check if user is subgroup leader for specific subgroup
churchUserSchema.methods.isSubgroupLeaderFor = function(subgroupId) {
  return this.subgroupLeaderships.some(id => id.toString() === subgroupId.toString());
};

// Method to add group leadership
churchUserSchema.methods.addGroupLeadership = function(groupId) {
  if (!this.groupLeaderships.includes(groupId)) {
    this.groupLeaderships.push(groupId);
  }
  return this.save();
};

// Method to add subgroup leadership
churchUserSchema.methods.addSubgroupLeadership = function(subgroupId) {
  if (!this.subgroupLeaderships.includes(subgroupId)) {
    this.subgroupLeaderships.push(subgroupId);
  }
  return this.save();
};

const ChurchUser = mongoose.model('ChurchUser', churchUserSchema);
export default ChurchUser;