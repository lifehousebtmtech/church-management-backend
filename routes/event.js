// routes/event.js
import express from 'express';
import Event from '../models/event.js';
import Person from '../models/person.js';
import { auth} from '../middleware/auth.js';
import Attendance from '../models/attendance.js';

const router = express.Router();

// Create new event
router.post('/', auth, async (req, res) => {
  try {
    const eventData = req.body;
    const event = new Event(eventData);
    await event.save();
    
    const populatedEvent = await Event.findById(event._id)
      .populate('eventInCharge', 'name email')
      .populate('welcomeTeamLead', 'name email')
      .populate('checkInInCharge', 'name email')
      .populate('cafeTeamLead', 'name email')
      .populate('mediaTeamLead', 'name email')
      .populate('welcomeTeam.person', 'firstName lastName email')
      .populate('cafeTeam.person', 'firstName lastName email')
      .populate('mediaTeam.person', 'firstName lastName email');

    res.status(201).json(populatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all events with filters and pagination
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      startDate, 
      endDate 
    } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.startDateTime = {};
      if (startDate) query.startDateTime.$gte = new Date(startDate);
      if (endDate) query.startDateTime.$lte = new Date(endDate);
    }

    const events = await Event.find(query)
      .populate('eventInCharge', 'name email')
      .populate('welcomeTeamLead', 'name email')
      .populate('checkInInCharge', 'name email')
      .sort({ startDateTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Event.countDocuments(query);

    res.json({
      events,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single event
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('eventInCharge', 'name email')
      .populate('welcomeTeamLead', 'name email')
      .populate('checkInInCharge', 'name email')
      .populate('cafeTeamLead', 'name email')
      .populate('mediaTeamLead', 'name email')
      .populate('welcomeTeam.person', 'firstName lastName email')
      .populate('cafeTeam.person', 'firstName lastName email')
      .populate('mediaTeam.person', 'firstName lastName email')
      .populate('attendees.person', 'firstName lastName phone')
      .populate('attendees.checkedInBy', 'name');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update event
router.put('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('eventInCharge', 'name email')
    .populate('welcomeTeamLead', 'name email')
    .populate('checkInInCharge', 'name email')
    .populate('cafeTeamLead', 'name email')
    .populate('mediaTeamLead', 'name email')
    // Add these population queries
    .populate('welcomeTeam.person', 'firstName lastName email')
    .populate('cafeTeam.person', 'firstName lastName email')
    .populate('mediaTeam.person', 'firstName lastName email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
});

// Check-in person to event
router.post('/:id/check-in', auth, async (req, res) => {
  try {
    const { personId } = req.body;
    
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Authorization check
    const isAdmin = req.user.role === 'admin';
    const isCheckInInCharge = event.checkInInCharge.some(
      charge => charge._id.toString() === req.user._id.toString()
    );

    if (!isAdmin && !isCheckInInCharge) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const person = await Person.findById(personId);
    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }

    // Check if already checked in
    const existingAttendance = await Attendance.findOne({
      eventId: event._id,
      personId: person._id
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Person already checked in' });
    }

    // Create attendance record
    const attendance = new Attendance({
      eventId: event._id,
      eventName: event.name,
      personId: person._id,
      personName: `${person.firstName} ${person.lastName}`,
      checkedInBy: req.user._id,
      checkedInByName: req.user.name 
    });

    await attendance.save();

    // Update event attendees for backward compatibility
    event.attendees.push({
      person: personId,
      checkInTime: attendance.checkinTime,
      checkedInBy: req.user._id
    });

    await event.save();

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/:id/attendance', auth, async (req, res) => {
  try {
    const attendance = await Attendance.find({ eventId: req.params.id })
      .populate('checkedInBy', 'name')
      .sort('-checkinTime');
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search attendees by phone number
router.get('/:id/search-attendees', auth, async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Search in People collection
    const people = await Person.find({ phone: new RegExp(phone, 'i') })
      .select('firstName lastName phone householdId');

    // Get unique household IDs
    const householdIds = [...new Set(people
      .map(person => person.householdId)
      .filter(id => id))];

    // Get all people from these households
    const householdMembers = await Person.find({
      householdId: { $in: householdIds }
    }).select('firstName lastName phone householdId');

    // Combine and remove duplicates
    const allPeople = [...people, ...householdMembers];
    const uniquePeople = Array.from(new Set(allPeople.map(p => p._id)))
      .map(id => allPeople.find(p => p._id === id));

    res.json(uniquePeople);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/attendance', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('attendees.person', 'firstName lastName')
      .populate('attendees.checkedInBy', 'name')
      .select('name startDateTime attendees');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const attendees = event.attendees.map(attendee => ({
      personName: `${attendee.person.firstName} ${attendee.person.lastName}`,
      checkinTime: attendee.checkInTime,
      checkedInBy: {
        name: attendee.checkedInBy?.name || 'Unknown'
      }
    }));

    res.json(attendees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add newcomers route
router.get('/:id/newcomers', auth, async (req, res) => {
  try {
    const newcomers = await Person.find({
      'eventRegistration.eventId': req.params.id
    }).select('firstName lastName phone invitedBy eventRegistration');

    res.json(newcomers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;