// models/person.js
import mongoose from 'mongoose';

const personSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  profileImage: {
    data: Buffer,
    contentType: String
  },
  householdId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Household'
  },
  invitedBy: {
    type: String,
    trim: true
  },
  eventRegistration: {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    registrationDate: {
      type: Date,
      default: Date.now
    }
  },
  groupInterests: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for searching
personSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  email: 'text' 
});

// Virtual for full name
personSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for group memberships
personSchema.virtual('groupMemberships', {
  ref: 'GroupMember',
  localField: '_id',
  foreignField: 'person'
});

// Virtual for group leaderships
personSchema.virtual('groupLeaderships', {
  ref: 'Group',
  localField: '_id',
  foreignField: 'leaders'
});

// Virtual for subgroup leaderships
personSchema.virtual('subgroupLeaderships', {
  ref: 'Subgroup',
  localField: '_id',
  foreignField: 'leaders'
});

// Method to get public profile (excludes sensitive data)
personSchema.methods.toPublicJSON = function() {
  const personObject = this.toObject();
  delete personObject.createdAt;
  delete personObject.updatedAt;
  delete personObject.__v;
  return personObject;
};

// Method to get all groups (both as member and leader)
personSchema.methods.getAllGroups = async function() {
  await this.populate('groupMemberships').populate('groupLeaderships');
  
  const memberGroups = this.groupMemberships?.map(membership => membership.group) || [];
  const leaderGroups = this.groupLeaderships || [];
  
  // Combine and remove duplicates
  const allGroupIds = [...new Set([...memberGroups, ...leaderGroups].map(g => g.toString()))];
  
  // Fetch full group details
  const Group = mongoose.model('Group');
  return await Group.find({ _id: { $in: allGroupIds } });
};

const Person = mongoose.model('Person', personSchema);

export default Person;