// backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import { hasPermission } from '../utils/roles.js';

export const auth = (req, res, next) => {
 try {
   const token = req.header('Authorization')?.replace('Bearer ', '');
   if (!token) throw new Error();
   
   const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
   req.user = {
     ...decoded,
     permissions: decoded.permissions || [],
     teamLeaderships: decoded.teamLeaderships || [],
     groupLeaderships: decoded.groupLeaderships || [],
     subgroupLeaderships: decoded.subgroupLeaderships || []
   };
   next();
 } catch (error) {
   res.status(401).json({ message: 'Please authenticate' });
 }
};

export const checkPermission = (permission) => (req, res, next) => {
 if (!hasPermission(req.user.role, permission)) {
   return res.status(403).json({ message: 'Permission denied' });
 }
 next();
};

export const checkTeamLeadership = (team) => (req, res, next) => {
 if (!req.user.teamLeaderships?.includes(team)) {
   return res.status(403).json({ message: 'Team leadership required' });
 }
 next();
};

export const checkGroupLeadership = (groupId) => (req, res, next) => {
 if (!req.user.groupLeaderships?.includes(groupId) && !hasPermission(req.user.role, 'manage_groups')) {
   return res.status(403).json({ message: 'Group leadership or admin role required' });
 }
 next();
};

export const checkSubgroupLeadership = (subgroupId) => (req, res, next) => {
 if (!req.user.subgroupLeaderships?.includes(subgroupId) && !hasPermission(req.user.role, 'manage_groups')) {
   return res.status(403).json({ message: 'Subgroup leadership or admin role required' });
 }
 next();
};