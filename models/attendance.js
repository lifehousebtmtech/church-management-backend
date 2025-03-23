import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  eventName: {
    type: String,
    required: true
  },
  personId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
    required: true
  },
  personName: {
    type: String,
    required: true
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChurchUser',
    required: true
  },
  checkinTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;