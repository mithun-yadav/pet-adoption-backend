import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

// Validation middleware wrapper
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg
      }))
    });
    return;
  }
  next();
};

// Register validation rules
export const registerValidation: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
  body('address').optional().trim()
];

// Login validation rules
export const loginValidation: ValidationChain[] = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Pet validation rules
export const petValidation: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('Pet name is required'),
  body('species').isIn(['dog', 'cat', 'bird', 'rabbit', 'other']).withMessage('Invalid species'),
  body('breed').trim().notEmpty().withMessage('Breed is required'),
  body('age').isInt({ min: 0 }).withMessage('Age must be a positive number'),
  body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('description').trim().notEmpty().withMessage('Description is required')
];

// Application validation rules
export const applicationValidation: ValidationChain[] = [
  body('reason').trim().notEmpty().withMessage('Reason for adoption is required'),
  body('experience').trim().notEmpty().withMessage('Pet experience is required'),
  body('livingSpace').isIn(['apartment', 'house', 'farm']).withMessage('Invalid living space'),
  body('hasOtherPets').isBoolean().withMessage('Has other pets must be true or false')
];