import express from 'express';
import {
  createApplication,
  getMyApplications,
  getAllApplications,
  getApplication,
  reviewApplication,
  deleteApplication
} from '../controllers/applicationController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/roleCheck';
import { applicationValidation, validate } from '../utils/validators';

const router = express.Router();

// User routes
router.post('/', protect, applicationValidation, validate, createApplication);
router.get('/my-applications', protect, getMyApplications);
router.get('/:id', protect, getApplication);
router.delete('/:id', protect, deleteApplication);

// Admin routes
router.get('/', protect, authorize('admin'), getAllApplications);
router.patch('/:id/review', protect, authorize('admin'), reviewApplication);

export default router;