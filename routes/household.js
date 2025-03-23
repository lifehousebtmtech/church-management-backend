// routes/household.js
import express from 'express';
import mongoose from 'mongoose';
import Person from '../models/person.js';

const router = express.Router();

// Schema Definitions
const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    trim: true
  }
});

const householdSchema = new mongoose.Schema({
  headOfHousehold: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
    required: true
  },
  spouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person'
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person'
  }],
  familyImage: {
    type: String,
    default: null
  },
  address: addressSchema,
  primaryPhone: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

const Household = mongoose.model('Household', householdSchema);

// Routes with Controller Logic
// Create household
router.post('/', async (req, res) => {
  try {
    const household = new Household(req.body);
    await household.save();

    // Update the householdId for all members
    await Person.updateMany(
      { 
        _id: { 
          $in: [
            household.headOfHousehold,
            household.spouse,
            ...household.children
          ].filter(Boolean)
        }
      },
      { householdId: household._id }
    );

    const populatedHousehold = await Household.findById(household._id)
      .populate('headOfHousehold')
      .populate('spouse')
      .populate('children');

    res.status(201).json(populatedHousehold);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all households with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const households = await Household.find()
      .populate('headOfHousehold')
      .populate('spouse')
      .populate('children')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Household.countDocuments();

    res.json({
      households,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single household
router.get('/:id', async (req, res) => {
  try {
    const household = await Household.findById(req.params.id)
      .populate('headOfHousehold')
      .populate('spouse')
      .populate('children');

    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }
    res.json(household);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update household
router.put('/:id', async (req, res) => {
  try {
    const household = await Household.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    .populate('headOfHousehold')
    .populate('spouse')
    .populate('children');

    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }

    // Update householdId for members
    await Person.updateMany(
      { householdId: household._id },
      { $unset: { householdId: "" } }
    );

    await Person.updateMany(
      { 
        _id: { 
          $in: [
            household.headOfHousehold,
            household.spouse,
            ...household.children
          ].filter(Boolean)
        }
      },
      { householdId: household._id }
    );

    res.json(household);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete household
router.delete('/:id', async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);
    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }

    // Remove householdId from all members
    await Person.updateMany(
      { householdId: household._id },
      { $unset: { householdId: "" } }
    );

    await Household.findByIdAndDelete(household._id);
    res.json({ message: 'Household deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;