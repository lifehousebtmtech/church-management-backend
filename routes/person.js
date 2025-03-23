// routes/person.js
import express from 'express';
import multer from 'multer';
import Person from '../models/person.js';
import GroupMember from '../models/groupMember.js';
import { auth, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Multer configuration
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// routes/person.js - Update the POST route
router.post('/', express.json(), upload.single('profileImage'), async (req, res) => {
  try {
    console.log('Raw request body:', req.body);
    const personData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      gender: req.body.gender,
      dateOfBirth: req.body.dateOfBirth,
      phone: req.body.phone,
      email: req.body.email
    };

    // Add group interests if provided
    if (req.body.groupInterests) {
      personData.groupInterests = Array.isArray(req.body.groupInterests) 
        ? req.body.groupInterests 
        : [req.body.groupInterests];
    }

    console.log('Processed person data:', personData);

    const person = new Person(personData);
    const savedPerson = await person.save();
    res.status(201).json(savedPerson);
  } catch (error) {
    console.error('Server error:', error);
    res.status(400).json({ message: error.message });
  }
});

// backend/routes/person.js - Add new route
router.post('/quick-register', async (req, res) => {
  try {
    const { firstName, lastName, gender, phone, invitedBy, eventId, groupInterests } = req.body;
    
    const person = new Person({
      firstName,
      lastName,
      gender,
      phone,
      invitedBy,
      eventRegistration: {
        eventId,
        registrationDate: new Date()
      },
      groupInterests: groupInterests || []
    });

    const savedPerson = await person.save();
    res.status(201).json(savedPerson);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Search people
router.get('/search', async (req, res) => {
  try {
    const { query, group } = req.query;
    console.log('Search query:', query, 'Group filter:', group);

    if (!query || query.length < 2) {
      return res.json({ people: [] });
    }

    const searchQuery = {
      $or: [
        { firstName: new RegExp(query, 'i') },
        { lastName: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') }
      ]
    };

    let people = await Person.find(searchQuery)
      .select('firstName lastName email phone _id groupInterests')
      .limit(10);

    // If group filter is applied, filter for people in or not in that group
    if (group) {
      const groupId = group;
      const existingMembersIds = await GroupMember.find({ group: groupId })
        .distinct('person');
      
      // Filter out people already in the group
      people = people.filter(person => 
        !existingMembersIds.some(id => id.toString() === person._id.toString())
      );
    }

    console.log('Search results:', people);
    res.json({ people });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: error.message, people: [] });
  }
});

// Get all people with search and pagination
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 10, groupId } = req.query;
    let query = {};
    console.log('GET /people request received'); // Debug log

    if (search) {
      query = {
        $or: [
          { firstName: new RegExp(search, 'i') },
          { lastName: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ]
      };
    }

    // If filtering by group
    if (groupId) {
      const groupMembers = await GroupMember.find({ group: groupId }).distinct('person');
      query._id = { $in: groupMembers };
    }

    const people = await Person.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    console.log(`Found ${people.length} people`); // Debug log

    const count = await Person.countDocuments(query);
    
    const response = {
      people,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    };
    
    console.log('Sending response:', response); // Debug log
    res.json(response);
  } catch (error) {
    console.error('Error in GET /people:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single person
router.get('/:id', async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }
    res.json(person);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get person's groups
router.get('/:id/groups', auth, async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }

    // Get all groups as member
    const memberships = await GroupMember.find({ person: req.params.id })
      .populate('group', 'name description meetingDay meetingTime')
      .populate('subgroup', 'name description meetingDay meetingTime');
    
    // Get all groups as leader
    await person.populate('groupLeaderships', 'name description meetingDay meetingTime');
    await person.populate('subgroupLeaderships', 'name description meetingDay meetingTime parentGroup');
    
    const groups = {
      asMember: memberships.map(m => ({
        group: m.group,
        subgroup: m.subgroup,
        role: m.role,
        joinDate: m.joinDate
      })),
      asLeader: person.groupLeaderships || [],
      asSubgroupLeader: person.subgroupLeaderships || []
    };
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get person's profile image
router.get('/:id/image', async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person || !person.profileImage || !person.profileImage.data) {
      console.log('No image found for person:', req.params.id);
      return res.status(404).send('No image found');
    }

    res.set({
      'Content-Type': person.profileImage.contentType,
      'Cache-Control': 'public, max-age=3600'
    });
    
    res.send(person.profileImage.data);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update person
router.put('/:id', upload.single('profileImage'), async (req, res) => {
  try {
    const updateData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      gender: req.body.gender
    };

    // Add optional fields if they exist
    if (req.body.dateOfBirth) updateData.dateOfBirth = req.body.dateOfBirth;
    if (req.body.phone) updateData.phone = req.body.phone;
    if (req.body.email) updateData.email = req.body.email;
    
    // Update group interests if provided
    if (req.body.groupInterests) {
      updateData.groupInterests = Array.isArray(req.body.groupInterests) 
        ? req.body.groupInterests 
        : [req.body.groupInterests];
    }

    // Add image if uploaded
    if (req.file) {
      updateData.profileImage = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    const person = await Person.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }
    res.json(person);
  } catch (error) {
    console.error('Error updating person:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete person
router.delete('/:id', async (req, res) => {
  try {
    // Remove person from all groups first
    await GroupMember.deleteMany({ person: req.params.id });
    
    const person = await Person.findByIdAndDelete(req.params.id);
    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }
    res.json({ message: 'Person deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;