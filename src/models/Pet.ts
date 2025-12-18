import mongoose, { Schema } from 'mongoose';
import { IPet } from '../types';

const petSchema = new Schema<IPet>({
  name: {
    type: String,
    required: [true, 'Please provide pet name'],
    trim: true
  },
  species: {
    type: String,
    required: [true, 'Please provide species'],
    enum: ['dog', 'cat', 'bird', 'rabbit', 'other'],
    lowercase: true
  },
  breed: {
    type: String,
    required: [true, 'Please provide breed'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Please provide age'],
    min: 0
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true,
    lowercase: true
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large'],
    lowercase: true
  },
  color: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide description']
  },
  photo: {
    type: String,
    default: 'https://via.placeholder.com/400x300?text=Pet+Photo'
  },
  status: {
    type: String,
    enum: ['available', 'pending', 'adopted'],
    default: 'available'
  },
  vaccinated: {
    type: Boolean,
    default: false
  },
  neutered: {
    type: Boolean,
    default: false
  },
  addedBy: {
    type: String,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for search and filtering
petSchema.index({ name: 'text', breed: 'text' });
petSchema.index({ species: 1, status: 1 });

export default mongoose.model<IPet>('Pet', petSchema);