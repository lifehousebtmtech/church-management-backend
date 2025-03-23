// backend/models/subgroup.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const subgroupSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  parentGroup: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  leaders: [{
    type: Schema.Types.ObjectId,
    ref: 'Person'
  }],
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
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  church: {
    type: Schema.Types.ObjectId,
    ref: 'ChurchUser',
    required: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for members (from groupMember model)
subgroupSchema.virtual('members', {
  ref: 'GroupMember',
  localField: '_id',
  foreignField: 'subgroup'
});

// Pre-remove hook to remove member associations
subgroupSchema.pre('remove', async function(next) {
  const GroupMember = mongoose.model('GroupMember');
  
  // Remove subgroup from all group memberships (but keep the members in the parent group)
  await GroupMember.updateMany(
    { subgroup: this._id },
    { $unset: { subgroup: 1 } }
  );
  
  next();
});

const Subgroup = mongoose.model('Subgroup', subgroupSchema);

export default Subgroup;