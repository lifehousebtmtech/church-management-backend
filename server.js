// server.js
import express from 'express';
import cors from 'cors';
import { connectDB, errorHandler } from './utils/db.js';
import config from './utils/db.js';
import householdRoutes from './routes/household.js';
import personRoutes from './routes/person.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/event.js';
import churchUsersRoutes from './routes/churchUsers.js';
import groupRoutes from './routes/group.js';
import subgroupRoutes from './routes/subgroup.js';
import { auth } from './middleware/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/households', auth, householdRoutes);
app.use('/api/people', auth, personRoutes);
app.use('/api/events', auth, eventRoutes);
app.use('/api/church-users', auth, churchUsersRoutes);
app.use('/api/groups', auth, groupRoutes);
app.use('/api/subgroups', auth, subgroupRoutes);

app.use(errorHandler);

connectDB().then(() => {
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
});