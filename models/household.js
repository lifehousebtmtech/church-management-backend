// models/household.js
import mongoose from 'mongoose';

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
export default Household;