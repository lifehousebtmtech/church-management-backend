// routes/subgroup.js
import express from 'express';
import mongoose from 'mongoose';
import Subgroup from '../models/subgroup.js';
import Group from '../models/group.js';
import GroupMember from '../models/groupMember.js';
import { auth, checkPermission, checkGroupLeadership, checkSubgroupLeadership } from '../middleware/auth.js';

const router = express.Router();

// Helper function to check if user is authorized for subgroup operations
const authorizeSubgroupAccess = async (req, subgroupId) => {
  // Admin can access all subgroups
  if (req.user.role === 'admin' || req.user.permissions.includes('manage_groups')) {
    return true;
  }
  
  // Check if user is a leader of this subgroup
  if (req.user.subgroupLeaderships && req.user.subgroupLeaderships.includes(subgroupId)) {
    return true;
  }
  
  // Check if user is a leader of the parent group
  const subgroup = await Subgroup.findById(subgroupId);
  if (!subgroup) {
    return false;
  }
  
  if (req.user.groupLeaderships && req.user.groupLeaderships.includes(subgroup.parentGroup.toString())) {
    return true;
  }
  
  return false;
};

/**
 * @route   GET /api/subgroups
 * @desc    Get all subgroups for the church
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const subgroups = await Subgroup.find({ church: req.user.church })
      .populate('leaders', 'firstName lastName email')
      .populate('parentGroup', 'name')
      .sort({ name: 1 });
    
    res.json(subgroups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/subgroups/by-group/:groupId
 * @desc    Get all subgroups for a specific group
 * @access  Private
 */
router.get('/by-group/:groupId', auth, async (req, res) => {
  try {
    const subgroups = await Subgroup.find({ 
      parentGroup: req.params.groupId,
      church: req.user.church 
    })
      .populate('leaders', 'firstName lastName email')
      .sort({ name: 1 });
    
    res.json(subgroups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST /api/subgroups
 * @desc    Create a new subgroup
 * @access  Private (Admin or Group Leader)
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      parentGroup,
      leaders,
      meetingDay,
      meetingTime,
      meetingLocation
    } = req.body;

    // Check if parent group exists
    const group = await Group.findById(parentGroup);
    if (!group) {
      return res.status(404).json({ msg: 'Parent group not found' });
    }

    // Check if user has access to parent group
    const isAdmin = req.user.role === 'admin' || req.user.permissions.includes('manage_groups');
    const isGroupLeader = req.user.groupLeaderships && req.user.groupLeaderships.includes(parentGroup);
    
    if (!isAdmin && !isGroupLeader) {
      return res.status(403).json({ msg: 'Not authorized to create subgroups for this group' });
    }

    const subgroup = new Subgroup({
      name,
      description,
      parentGroup,
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

/**
 * @route   GET /api/subgroups/:id
 * @desc    Get subgroup by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const subgroup = await Subgroup.findOne({
      _id: req.params.id,
      church: req.user.church
    })
      .populate('leaders', 'firstName lastName email')
      .populate('parentGroup', 'name');
    
    if (!subgroup) {
      return res.status(404).json({ msg: 'Subgroup not found' });
    }

    res.json(subgroup);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Subgroup not found' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/subgroups/:id
 * @desc    Update a subgroup
 * @access  Private (Admin, Group Leader, or Subgroup Leader)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      meetingDay,
      meetingTime,
      meetingLocation,
      leaders,
      isActive
    } = req.body;

    // Check if user has access to this subgroup
    const hasAccess = await authorizeSubgroupAccess(req, req.params.id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to update this subgroup' });
    }

    const subgroupFields = {};
    if (name) subgroupFields.name = name;
    if (description !== undefined) subgroupFields.description = description;
    if (meetingDay) subgroupFields.meetingDay = meetingDay;
    if (meetingTime !== undefined) subgroupFields.meetingTime = meetingTime;
    if (meetingLocation !== undefined) subgroupFields.meetingLocation = meetingLocation;
    if (leaders) subgroupFields.leaders = leaders;
    if (isActive !== undefined) subgroupFields.isActive = isActive;

    const subgroup = await Subgroup.findOneAndUpdate(
      { _id: req.params.id, church: req.user.church },
      { $set: subgroupFields },
      { new: true }
    ).populate('leaders', 'firstName lastName email');

    if (!subgroup) {
      return res.status(404).json({ msg: 'Subgroup not found' });
    }

    res.json(subgroup);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Subgroup not found' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE /api/subgroups/:id
 * @desc    Delete a subgroup
 * @access  Private (Admin or Group Leader)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const subgroup = await Subgroup.findById(req.params.id);
    
    if (!subgroup) {
      return res.status(404).json({ msg: 'Subgroup not found' });
    }
    
    // Check if user has access (must be admin or parent group leader)
    const isAdmin = req.user.role === 'admin' || req.user.permissions.includes('manage_groups');
    const isGroupLeader = req.user.groupLeaderships && 
      req.user.groupLeaderships.includes(subgroup.parentGroup.toString());
    
    if (!isAdmin && !isGroupLeader) {
      return res.status(403).json({ msg: 'Not authorized to delete this subgroup' });
    }
    
    // Remove subgroup from member records
    await GroupMember.updateMany(
      { subgroup: req.params.id },
      { $unset: { subgroup: "" } }
    );
    
    // Remove subgroup from ChurchUser subgroupLeaderships
    const ChurchUser = mongoose.model('ChurchUser');
    await ChurchUser.updateMany(
      { subgroupLeaderships: req.params.id },
      { $pull: { subgroupLeaderships: req.params.id } }
    );
    
    // Delete the subgroup
    await Subgroup.deleteOne({ _id: req.params.id });

    res.json({ msg: 'Subgroup deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Subgroup not found' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/subgroups/:id/members
 * @desc    Get all members of a subgroup
 * @access  Private
 */
router.get('/:id/members', auth, async (req, res) => {
  try {
    const members = await GroupMember.find({
      subgroup: req.params.id,
      church: req.user.church
    })
      .populate('person', 'firstName lastName email phone')
      .populate('group', 'name');

    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST /api/subgroups/:id/members/:personId
 * @desc    Add an existing group member to a subgroup
 * @access  Private (Admin, Group Leader, or Subgroup Leader)
 */
router.post('/:id/members/:personId', auth, async (req, res) => {
  try {
    // Check if user has access to this subgroup
    const hasAccess = await authorizeSubgroupAccess(req, req.params.id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to manage this subgroup' });
    }
    
    // Get the subgroup to find its parent group
    const subgroup = await Subgroup.findById(req.params.id);
    if (!subgroup) {
      return res.status(404).json({ msg: 'Subgroup not found' });
    }
    
    // Find if the person is already a member of the parent group
    const groupMember = await GroupMember.findOne({
      person: req.params.personId,
      group: subgroup.parentGroup
    });
    
    if (!groupMember) {
      return res.status(400).json({ 
        msg: 'Person must be a member of the parent group before joining a subgroup'
      });
    }
    
    // Update the group member record to include this subgroup
    groupMember.subgroup = req.params.id;
    await groupMember.save();
    
    const updatedMember = await GroupMember.findById(groupMember._id)
      .populate('person', 'firstName lastName email phone')
      .populate('group', 'name')
      .populate('subgroup', 'name');
    
    res.json(updatedMember);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE /api/subgroups/:id/members/:personId
 * @desc    Remove a member from a subgroup (but keep in parent group)
 * @access  Private (Admin, Group Leader, or Subgroup Leader)
 */
router.delete('/:id/members/:personId', auth, async (req, res) => {
  try {
    // Check if user has access to this subgroup
    const hasAccess = await authorizeSubgroupAccess(req, req.params.id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to manage this subgroup' });
    }
    
    // Find the group member record
    const groupMember = await GroupMember.findOne({
      person: req.params.personId,
      subgroup: req.params.id
    });
    
    if (!groupMember) {
      return res.status(404).json({ msg: 'Member not found in this subgroup' });
    }
    
    // Remove subgroup reference but keep in parent group
    groupMember.subgroup = null;
    await groupMember.save();
    
    res.json({ msg: 'Member removed from subgroup' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST /api/subgroups/:id/attendance
 * @desc    Record attendance for subgroup members
 * @access  Private (Admin, Group Leader, or Subgroup Leader)
 */
router.post('/:id/attendance', auth, async (req, res) => {
  try {
    const { date, attendanceData } = req.body;
    
    if (!date || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ msg: 'Date and attendance data array required' });
    }
    
    // Check if user has access to this subgroup
    const hasAccess = await authorizeSubgroupAccess(req, req.params.id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to record attendance for this subgroup' });
    }
    
    const results = [];
    
    // Process each attendance record
    for (const record of attendanceData) {
      const { memberId, status, notes } = record;
      
      const member = await GroupMember.findOne({
        _id: memberId,
        subgroup: req.params.id,
        church: req.user.church
      });
      
      if (!member) {
        results.push({
          memberId,
          success: false,
          message: 'Member not found in this subgroup'
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
 * @route   GET /api/subgroups/:id/attendance
 * @desc    Get attendance report for a subgroup
 * @access  Private (Admin, Group Leader, or Subgroup Leader)
 */
router.get('/:id/attendance', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ msg: 'Start date and end date are required' });
    }
    
    // Check if user has access to this subgroup
    const hasAccess = await authorizeSubgroupAccess(req, req.params.id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to view attendance for this subgroup' });
    }
    
    // Get all members of the subgroup
    const members = await GroupMember.find({ 
      subgroup: req.params.id,
      church: req.user.church
    });
    
    const memberIds = members.map(m => m._id);
    
    // Create a simplified version of the group attendance method
    const attendanceData = await Promise.all(
      members.map(async (member) => {
        const person = await mongoose.model('Person').findById(member.person);
        
        // Filter attendance records by date range
        const filteredAttendance = member.attendance.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
        });
        
        return {
          memberId: member._id,
          firstName: person.firstName,
          lastName: person.lastName,
          attendance: filteredAttendance
        };
      })
    );
    
    res.json(attendanceData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;