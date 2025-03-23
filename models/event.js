// models/event.js
import mongoose from 'mongoose';

const recurringSchema = new mongoose.Schema({
  frequency: {
    type: String,
    enum: ['weekly', 'monthly'],
    required: true
  },
  days: [{
    type: String,
    enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  }],
  endDate: {
    type: Date
  }
});

const teamMembersSchema = new mongoose.Schema({
  person: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
    required: true
  },
  personName: {
    type: String,
    required: true
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkInTime: {
    type: Date
  }
});

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  startDateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'in_progress', 'completed'],
    default: 'draft'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: recurringSchema,
  
  // Leadership roles (from ChurchUser)
  eventInCharge: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChurchUser'
    },
    name: String
  }],
  welcomeTeamLead: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChurchUser'
    },
    name: String
  },
  checkInInCharge: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChurchUser'
    },
    name: String
  }],
  cafeTeamLead: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChurchUser'
    },
    name: String
  },
  mediaTeamLead: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChurchUser'
    },
    name: String
  },

  // Team Members (from People)
  welcomeTeam: [teamMembersSchema],
  cafeTeam: [teamMembersSchema],
  mediaTeam: [teamMembersSchema],

  // Attendance tracking
  attendees: [{
    person: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person'
    },
    checkInTime: {
      type: Date
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChurchUser'
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
eventSchema.index({ startDateTime: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ 'attendees.person': 1 });

// Virtual for getting total attendance
eventSchema.virtual('totalAttendance').get(function() {
  return this.attendees.length;
});

// Method to check if a user is authorized for check-ins
eventSchema.methods.isAuthorizedForCheckIn = function(userId) {
  return this.checkInInCharge.some(id => id.equals(userId));
};

// Method to get team member counts
eventSchema.methods.getTeamCounts = function() {
  return {
    welcomeTeam: this.welcomeTeam.length,
    cafeTeam: this.cafeTeam.length,
    mediaTeam: this.mediaTeam.length
  };
};

const Event = mongoose.model('Event', eventSchema);
export default Event;