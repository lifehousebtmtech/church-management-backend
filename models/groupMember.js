// backend/models/groupMember.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const groupMemberSchema = new Schema({
  person: {
    type: Schema.Types.ObjectId,
    ref: 'Person',
    required: true
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  subgroup: {
    type: Schema.Types.ObjectId,
    ref: 'Subgroup'
    // Not required as a member can be in a main group without being in a subgroup
  },
  role: {
    type: String,
    enum: ['member', 'leader', 'assistant', 'admin'],
    default: 'member'
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  },
  attendance: [{
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'excused'],
      required: true
    },
    notes: String
  }],
  church: {
    type: Schema.Types.ObjectId,
    ref: 'ChurchUser',
    required: true
  }
}, { timestamps: true });

// Compound index to ensure a person cannot be added to the same group twice
groupMemberSchema.index({ person: 1, group: 1 }, { unique: true });

// Custom method to record attendance
groupMemberSchema.methods.recordAttendance = function(date, status, notes = '') {
  this.attendance.push({
    date,
    status,
    notes
  });
  return this.save();
};

// Static method to get attendance report for a group
groupMemberSchema.statics.getGroupAttendance = async function(groupId, startDate, endDate) {
  const attendanceData = await this.aggregate([
    {
      $match: {
        group: mongoose.Types.ObjectId(groupId),
        'attendance.date': {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $lookup: {
        from: 'people',
        localField: 'person',
        foreignField: '_id',
        as: 'personData'
      }
    },
    {
      $unwind: '$personData'
    },
    {
      $project: {
        firstName: '$personData.firstName',
        lastName: '$personData.lastName',
        attendance: {
          $filter: {
            input: '$attendance',
            as: 'attend',
            cond: {
              $and: [
                { $gte: ['$$attend.date', new Date(startDate)] },
                { $lte: ['$$attend.date', new Date(endDate)] }
              ]
            }
          }
        }
      }
    }
  ]);
  
  return attendanceData;
};

const GroupMember = mongoose.model('GroupMember', groupMemberSchema);

export default GroupMember;