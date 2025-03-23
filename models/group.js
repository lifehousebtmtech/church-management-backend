// backend/models/group.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  purpose: {
    type: String,
    trim: true
  },
  meetingFrequency: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'custom'],
    default: 'weekly'
  },
  customFrequency: {
    type: String,
    trim: true
  },
  meetingDay: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'varies'],
    default: 'sunday'
  },
  meetingTime: {
    type: String,
    trim: true
  },
  meetingLocation: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  leaders: [{
    type: Schema.Types.ObjectId,
    ref: 'Person'
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  church: {
    type: Schema.Types.ObjectId,
    ref: 'ChurchUser',
    required: false
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for subgroups
groupSchema.virtual('subgroups', {
  ref: 'Subgroup',
  localField: '_id',
  foreignField: 'parentGroup'
});

// Virtual for members (from groupMember model)
groupSchema.virtual('members', {
  ref: 'GroupMember',
  localField: '_id',
  foreignField: 'group'
});

// Pre-remove hook to cascade delete subgroups and memberships
groupSchema.pre('remove', async function(next) {
  const Subgroup = mongoose.model('Subgroup');
  const GroupMember = mongoose.model('GroupMember');
  
  // Remove all subgroups
  await Subgroup.deleteMany({ parentGroup: this._id });
  
  // Remove all group memberships
  await GroupMember.deleteMany({ group: this._id });
  
  next();
});

const Group = mongoose.model('Group', groupSchema);

export default Group;