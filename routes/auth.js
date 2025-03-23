// backend/routes/auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import ChurchUser from '../models/churchUser.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await ChurchUser.findOne({ username })
      .populate('groupLeaderships')
      .populate('subgroupLeaderships');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { 
        _id: user._id,
        role: user.role,
        permissions: user.permissions,
        personId: user.person,
        groupLeaderships: user.groupLeaderships.map(g => g._id),
        subgroupLeaderships: user.subgroupLeaderships.map(sg => sg._id)
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: {
        role: user.role,
        username: user.username,
        person: user.person,
        permissions: user.permissions,
        groupLeaderships: user.groupLeaderships,
        subgroupLeaderships: user.subgroupLeaderships
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Validate group permission
router.get('/validate-group-permission/:groupId', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ hasPermission: false, message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if admin or has manage_groups permission
    if (decoded.role === 'admin' || decoded.permissions.includes('manage_groups')) {
      return res.json({ hasPermission: true });
    }
    
    // Check if group leader for this group
    if (decoded.groupLeaderships && decoded.groupLeaderships.includes(req.params.groupId)) {
      return res.json({ hasPermission: true });
    }
    
    res.json({ hasPermission: false });
  } catch (error) {
    console.error('Permission validation error:', error);
    res.status(500).json({ hasPermission: false, message: error.message });
  }
});

export default router;