// routes/churchUsers.js
import express from 'express';
import mongoose from 'mongoose';
import ChurchUser from '../models/churchUser.js';
import Person from '../models/person.js';
import Group from '../models/group.js';
import Subgroup from '../models/subgroup.js';
import { auth, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// IMPORTANT: Define specific routes before parameter routes
// Search users - must come before /:id
router.get('/search', auth, async (req, res) => {
  try {
    const { query, role } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ users: [] });
    }

    // Find people by name
    const nameQuery = new RegExp(query, 'i');

    const matchingPeople = await Person.find({
      $or: [
        { firstName: nameQuery },
        { lastName: nameQuery }
      ]
    });

    // Construct search query
    const searchQuery = {
      $or: [
        { username: nameQuery },
        { person: { $in: matchingPeople.map(p => p._id) } }
      ]
    };

    if (role) {
      searchQuery.role = role;
    }

    // Find church users
    const users = await ChurchUser.find(searchQuery)
      .populate({
        path: 'person',
        select: 'firstName lastName email'
      })
      .populate({
        path: 'groupLeaderships',
        select: 'name'
      })
      .lean();

    if (!users.length) {
      return res.status(404).json({ message: 'No matching users found' });
    }

    const transformedUsers = users.map(user => ({
      _id: user._id,
      name: user.person ? `${user.person.firstName} ${user.person.lastName}` : user.username,
      email: user.person?.email,
      role: user.role,
      groupLeaderships: user.groupLeaderships || []
    }));

    res.json({ users: transformedUsers });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update user permissions - must come before /:id
router.put('/update-permissions/:id', auth, async (req, res) => {
  try {
    const user = await ChurchUser.findByIdAndUpdate(
      req.params.id,
      { $set: { permissions: req.body.permissions } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Assign group leadership
router.post('/assign-group-leadership', auth, checkPermission('manage_groups'), async (req, res) => {
  try {
    const { userId, groupId } = req.body;
    
    const user = await ChurchUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Add user's person ID to group leaders
    if (!group.leaders.includes(user.person)) {
      group.leaders.push(user.person);
      await group.save();
    }
    
    // Add group to user's leadership roles
    await user.addGroupLeadership(groupId);
    
    res.json({ 
      message: 'Group leadership assigned successfully',
      user: await user.populate('groupLeaderships')
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove group leadership
router.post('/remove-group-leadership', auth, checkPermission('manage_groups'), async (req, res) => {
  try {
    const { userId, groupId } = req.body;
    
    const user = await ChurchUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Remove user's person ID from group leaders
    group.leaders = group.leaders.filter(
      leaderId => leaderId.toString() !== user.person.toString()
    );
    await group.save();
    
    // Remove group from user's leadership roles
    user.groupLeaderships = user.groupLeaderships.filter(
      leaderGroupId => leaderGroupId.toString() !== groupId
    );
    await user.save();
    
    res.json({ 
      message: 'Group leadership removed successfully',
      user: await user.populate('groupLeaderships')
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    const users = await ChurchUser.find()
      .populate({
        path: 'person',
        select: 'firstName lastName email profilePicture'
      })
      .populate({
        path: 'groupLeaderships',
        select: 'name'
      });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get one user
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await ChurchUser.findById(req.params.id)
      .populate('person')
      .populate('groupLeaderships')
      .populate('subgroupLeaderships');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a user
router.post('/', auth, async (req, res) => {
  try {
    const user = new ChurchUser(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a user
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await ChurchUser.findByIdAndUpdate(
      req.params.id, 
      req.body,
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a user
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await ChurchUser.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;