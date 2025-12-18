import { Response } from 'express';
import User from '../models/User';
import { generateToken } from '../middleware/auth';
import { AuthRequest, RegisterDTO, LoginDTO, ApiResponse, AuthResponse } from '../types';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, address }: RegisterDTO = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      } as ApiResponse);
      return;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address
    });

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      }
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    } as ApiResponse);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginDTO = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      } as ApiResponse);
      return;
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      } as ApiResponse);
      return;
    }

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      }
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    } as ApiResponse);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    
    res.status(200).json({
      success: true,
      data: user
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    } as ApiResponse);
  }
};