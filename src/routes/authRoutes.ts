import express from 'express';
import { register, login, getMe, refreshToken } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { registerValidation, loginValidation, validate } from '../utils/validators';

const router = express.Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getMe);

export default router;