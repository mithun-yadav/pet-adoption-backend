import express from 'express';
import {
  getPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
  updatePetStatus
} from '../controllers/petController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/roleCheck';
import { petValidation, validate } from '../utils/validators';

const router = express.Router();

// Public routes
router.get('/', getPets);
router.get('/:id', getPet);

// Admin only routes
router.post('/', protect, authorize('admin'), petValidation, validate, createPet);
router.put('/:id', protect, authorize('admin'), updatePet);
router.delete('/:id', protect, authorize('admin'), deletePet);
router.patch('/:id/status', protect, authorize('admin'), updatePetStatus);

export default router;