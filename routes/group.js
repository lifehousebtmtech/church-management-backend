// routes/group.js
import express from 'express';
import mongoose from 'mongoose';
import Group from '../models/group.js';
import Subgroup from '../models/subgroup.js';
import GroupMember from '../models/groupMember.js';
import Person from '../models/person.js';
import Event from '../models/event.js';
import { auth, checkPermission, checkGroupLeadership } from '../middleware/auth.js';

const router = express.Router();

// Helper function to check if user is authorized for group operations
const authorizeGroupAccess = async (req, groupId) => {
  // Admin can access all groups
  if (req.user.role === 'admin' || req.user.permissions.includes('manage_groups')) {
    return true;
  }
  
  // Check if user is a leader of this group
  if (req.user.groupLeaderships && req.user.groupLeaderships.includes(groupId)) {
    return true;
  }
  
  return false;
};

/**
 * @route   GET /api/groups
 * @desc    Get all groups for the church
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({ church: req.user.church })
      .populate('leaders', 'firstName lastName email')
      .sort({ name: 1 });
    
    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/groups/user
 * @desc    Get groups the current user is a member of
 * @access  Private
 */
router.get('/user', auth, async (req, res) => {
  try {
    // For now, return all groups with isMember=true for testing
    const groups = await Group.find({ church: req.user.church })
      .populate('leaders', 'firstName lastName email')
      .sort({ name: 1 });
    
    // Add isMember flag and role to each group
    const enrichedGroups = groups.map(group => ({
      ...group.toJSON(),
      isMember: true,
      role: 'member'
    }));
    
    res.json(enrichedGroups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/groups/stats
 * @desc    Get group statistics
 * @access  Private
 */
router.get('/stats', auth, async (req, res) => {
  try {
    // Count total groups
    const totalGroups = await Group.countDocuments({
      isActive: true 
    });
    
    // For demo purposes, return static data
    res.json({
      totalGroups,
      userGroups: Math.min(totalGroups, 2),  // Just assume user is in some groups
      activeGroups: Math.floor(totalGroups * 0.8),  // Assume 80% are active
      newGroups: Math.floor(totalGroups * 0.3)  // Assume 30% are new
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST /api/groups
 * @desc    Create a new group
 * @access  Private (Admin only)
 */
router.post('/', auth, checkPermission('manage_groups'), async (req, res) => {
  try {
    const {
      name,
      description,
      purpose,
      meetingFrequency,
      customFrequency,
      meetingDay,
      meetingTime,
      meetingLocation,
      leaders
    } = req.body;

    const group = new Group({
      name,
      description,
      purpose,
      meetingFrequency,
      customFrequency,
      meetingDay,
      meetingTime,
      meetingLocation,
      leaders: leaders || [],
      createdBy: req.user._id,
      church: req.user.church
    });

    await group.save();
    
    // Add group to leader's groupLeaderships array in ChurchUser
    if (leaders && leaders.length > 0) {
      const ChurchUser = mongoose.model('ChurchUser');
      
      // Find the church users associated with these person IDs
      const churchUsers = await ChurchUser.find({ 
        person: { $in: leaders } 
      });
      
      // Add this group to their groupLeaderships
      for (const user of churchUsers) {
        await user.addGroupLeadership(group._id);
      }
    }
    
    res.json(await group.populate('leaders', 'firstName lastName email'));
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: err.message });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/groups/:id
 * @desc    Get group by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      church: req.user.church
    })
      .populate('leaders', 'firstName lastName email')
      .populate({
        path: 'subgroups',
        populate: {
          path: 'leaders',
          select: 'firstName lastName email'
        }
      });
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    res.json(group);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/groups/:id
 * @desc    Update a group
 * @access  Private (Admin or Group Leader)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      purpose,
      meetingFrequency,
      customFrequency,
      meetingDay,
      meetingTime,
      meetingLocation,
      leaders,
      isActive
    } = req.body;

    // Check if user has access to this group
    const hasAccess = await authorizeGroupAccess(req, req.params.id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to update this group' });
    }

    const groupFields = {};
    if (name) groupFields.name = name;
    if (description !== undefined) groupFields.description = description;
    if (purpose !== undefined) groupFields.purpose = purpose;
    if (meetingFrequency) groupFields.meetingFrequency = meetingFrequency;
    if (customFrequency !== undefined) groupFields.customFrequency = customFrequency;
    if (meetingDay) groupFields.meetingDay = meetingDay;
    if (meetingTime !== undefined) groupFields.meetingTime = meetingTime;
    if (meetingLocation !== undefined) groupFields.meetingLocation = meetingLocation;
    if (leaders) groupFields.leaders = leaders;
    if (isActive !== undefined) groupFields.isActive = isActive;

    const group = await Group.findOneAndUpdate(
      { _id: req.params.id, church: req.user.church },
      { $set: groupFields },
      { new: true }
    ).populate('leaders', 'firstName lastName email');

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    res.json(group);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE /api/groups/:id
 * @desc    Delete a group
 * @access  Private (Admin only)
 */
router.delete('/:id', auth, checkPermission('manage_groups'), async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      church: req.user.church
    });

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    // Delete all related subgroups
    await Subgroup.deleteMany({ parentGroup: req.params.id });
    
    // Delete all group memberships
    await GroupMember.deleteMany({ group: req.params.id });
    
    // Remove group from ChurchUser groupLeaderships
    const ChurchUser = mongoose.model('ChurchUser');
    await ChurchUser.updateMany(
      { groupLeaderships: req.params.id },
      { $pull: { groupLeaderships: req.params.id } }
    );
    
    // Delete the group
    await Group.deleteOne({ _id: req.params.id });

    res.json({ msg: 'Group deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/groups/:id/members
 * @desc    Get all members of a group
 * @access  Private
 */
router.get('/:id/members', auth, async (req, res) => {
  try {
    const members = await GroupMember.find({
      group: req.params.id,
      church: req.user.church
    })
      .populate('person', 'firstName lastName email phone')
      .populate('subgroup', 'name');

    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST /api/groups/:id/members
 * @desc    Add a member to a group
 * @access  Private (Admin or Group Leader)
 */
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { personId, subgroupId, role } = req.body;

    // Check if user has access to this group
    const hasAccess = await authorizeGroupAccess(req, req.params.id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to add members to this group' });
    }

    // Check if member already exists in this group
    const existingMember = await GroupMember.findOne({
      person: personId,
      group: req.params.id
    });

    if (existingMember) {
      return res.status(400).json({ msg: 'Person is already a member of this group' });
    }

    const newMember = new GroupMember({
      person: personId,
      group: req.params.id,
      subgroup: subgroupId || null,
      role: role || 'member',
      church: req.user.church
    });

    await newMember.save();

    const member = await GroupMember.findById(newMember._id)
      .populate('person', 'firstName lastName email phone')
      .populate('subgroup', 'name');

    res.json(member);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: err.message });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/groups/members/:memberId
 * @desc    Update a group member
 * @access  Private (Admin or Group Leader)
 */
router.put('/members/:memberId', auth, async (req, res) => {
  try {
    const { subgroupId, role, isActive, notes } = req.body;

    const member = await GroupMember.findById(req.params.memberId)
      .populate('group');

    if (!member) {
      return res.status(404).json({ msg: 'Group member not found' });
    }

    // Check if user has access to this group
    const hasAccess = await authorizeGroupAccess(req, member.group._id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to update this group member' });
    }

    // Update fields
    if (subgroupId !== undefined) member.subgroup = subgroupId || null;
    if (role) member.role = role;
    if (isActive !== undefined) member.isActive = isActive;
    if (notes !== undefined) member.notes = notes;

    await member.save();

    const updatedMember = await GroupMember.findById(req.params.memberId)
      .populate('person', 'firstName lastName email phone')
      .populate('subgroup', 'name');

    res.json(updatedMember);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group member not found' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE /api/groups/members/:memberId
 * @desc    Remove a member from a group
 * @access  Private (Admin or Group Leader)
 */
router.delete('/members/:memberId', auth, async (req, res) => {
  try {
    const member = await GroupMember.findById(req.params.memberId)
      .populate('group');

    if (!member) {
      return res.status(404).json({ msg: 'Group member not found' });
    }

    // Check if user has access to this group
    const hasAccess = await authorizeGroupAccess(req, member.group._id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to remove members from this group' });
    }

    await GroupMember.deleteOne({ _id: req.params.memberId });

    res.json({ msg: 'Member removed from group' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group member not found' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST /api/groups/:id/attendance
 * @desc    Record attendance for group members
 * @access  Private (Admin or Group Leader)
 */
router.post('/:id/attendance', auth, async (req, res) => {
  try {
    const { date, attendanceData } = req.body;
    
    if (!date || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ msg: 'Date and attendance data array required' });
    }
    
    // Check if user has access to this group
    const hasAccess = await authorizeGroupAccess(req, req.params.id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to record attendance for this group' });
    }
    
    const results = [];
    
    // Process each attendance record
    for (const record of attendanceData) {
      const { memberId, status, notes } = record;
      
      const member = await GroupMember.findOne({
        _id: memberId,
        group: req.params.id,
        church: req.user.church
      });
      
      if (!member) {
        results.push({
          memberId,
          success: false,
          message: 'Member not found'
        });
        continue;
      }
      
      // Add attendance record
      member.attendance.push({
        date: new Date(date),
        status,
        notes: notes || ''
      });
      
      await member.save();
      
      results.push({
        memberId,
        success: true,
        message: 'Attendance recorded'
      });
    }
    
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/groups/:id/attendance
 * @desc    Get attendance report for a group
 * @access  Private (Admin or Group Leader)
 */
router.get('/:id/attendance', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ msg: 'Start date and end date are required' });
    }
    
    // Check if user has access to this group
    const hasAccess = await authorizeGroupAccess(req, req.params.id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to view attendance for this group' });
    }
    
    const attendanceReport = await GroupMember.getGroupAttendance(
      req.params.id,
      startDate,
      endDate
    );
    
    res.json(attendanceReport);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/groups/:id/events
 * @desc    Get events associated with a group
 * @access  Private
 */
router.get('/:id/events', auth, async (req, res) => {
  try {
    const events = await Event.find({ relatedGroups: req.params.id })
      .sort({ startDateTime: -1 })
      .populate('eventInCharge', 'name')
      .select('name description status startDateTime endDateTime location');
    
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/groups/by-interest/:interest
 * @desc    Get groups by interest category
 * @access  Private
 */
router.get('/by-interest/:interest', auth, async (req, res) => {
  try {
    // Find groups related to this interest area
    const groups = await Group.find({ 
      purpose: new RegExp(req.params.interest, 'i'),
      isActive: true
    })
    .select('name description meetingDay meetingTime meetingLocation')
    .sort('name');
    
    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST /api/groups/:id/subgroups
 * @desc    Create a subgroup within a group
 * @access  Private (Admin or Group Leader)
 */
router.post('/:id/subgroups', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      leaders,
      meetingDay,
      meetingTime,
      meetingLocation
    } = req.body;
    
    // Check if user has access to this group
    const hasAccess = await authorizeGroupAccess(req, req.params.id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to create subgroups for this group' });
    }
    
    // Create subgroup
    const subgroup = new Subgroup({
      name,
      description,
      parentGroup: req.params.id,
      leaders: leaders || [],
      meetingDay,
      meetingTime,
      meetingLocation,
      createdBy: req.user._id,
      church: req.user.church
    });
    
    await subgroup.save();
    
    // Add subgroup to leader's subgroupLeaderships array in ChurchUser
    if (leaders && leaders.length > 0) {
      const ChurchUser = mongoose.model('ChurchUser');
      
      // Find the church users associated with these person IDs
      const churchUsers = await ChurchUser.find({ 
        person: { $in: leaders } 
      });
      
      // Add this subgroup to their subgroupLeaderships
      for (const user of churchUsers) {
        if (!user.subgroupLeaderships) {
          user.subgroupLeaderships = [];
        }
        user.subgroupLeaderships.push(subgroup._id);
        await user.save();
      }
    }
    
    res.json(await subgroup.populate('leaders', 'firstName lastName email'));
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: err.message });
    }
    res.status(500).send('Server Error');
  }
});

export default router;