import mongoose, { Schema } from 'mongoose';
import { IApplication } from '../types';

const applicationSchema = new Schema<IApplication>({
  pet: {
    type: String,
    ref: 'Pet',
    required: true
  },
  user: {
    type: String,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reason: {
    type: String,
    required: [true, 'Please provide reason for adoption']
  },
  experience: {
    type: String,
    required: [true, 'Please provide your experience with pets']
  },
  livingSpace: {
    type: String,
    enum: ['apartment', 'house', 'farm'],
    required: true
  },
  hasOtherPets: {
    type: Boolean,
    default: false
  },
  adminNotes: {
    type: String
  },
  reviewedBy: {
    type: String,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications
applicationSchema.index({ pet: 1, user: 1 }, { unique: true });

export default mongoose.model<IApplication>('Application', applicationSchema);