import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../middleware/auth";
import {
  AuthRequest,
  RegisterDTO,
  LoginDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
  ApiResponse,
  AuthResponse,
} from "../types";

// Generate a random reset token
const generateResetToken = (): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 40; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Hash reset token using bcrypt
const hashResetToken = async (token: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(token, salt);
};

// Compare reset token
const compareResetToken = async (
  token: string,
  hashedToken: string
): Promise<boolean> => {
  return await bcrypt.compare(token, hashedToken);
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, phone, address }: RegisterDTO = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({
        success: false,
        message: "User already exists with this email",
      } as ApiResponse);
      return;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
    });

    const userId = String(user._id);
    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        _id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken: generateAccessToken(userId),
        refreshToken: generateRefreshToken(userId),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
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
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      } as ApiResponse);
      return;
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      } as ApiResponse);
      return;
    }

    const userId = String(user._id);
    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        _id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken: generateAccessToken(userId),
        refreshToken: generateRefreshToken(userId),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    } as ApiResponse);
  }
};

// @desc    Forgot password - generate reset token
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email }: ForgotPasswordDTO = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "No user found with that email",
      } as ApiResponse);
      return;
    }

    // Create reset token
    const resetToken = generateResetToken();
    const resetPasswordToken = await hashResetToken(resetToken);

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.save({ validateBeforeSave: false });

    // In a real app, you would send this via email.
    // For now, return the token so the frontend can use it.
    res.status(200).json({
      success: true,
      message: "Password reset token generated",
      data: {
        resetToken,
      },
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    } as ApiResponse);
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password }: ResetPasswordDTO = req.body;

    // Find all users with valid reset tokens and check them
    const users = await User.find({
      resetPasswordExpire: { $gt: new Date() },
      resetPasswordToken: { $exists: true },
    }).select("+password");

    let user = null;
    for (const u of users) {
      if (
        u.resetPasswordToken &&
        (await compareResetToken(token, u.resetPasswordToken))
      ) {
        user = u;
        break;
      }
    }

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token",
      } as ApiResponse);
      return;
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    } as ApiResponse);
  }
};

// @desc    Change password (authenticated user)
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { currentPassword, newPassword }: ChangePasswordDTO = req.body;

    const user = await User.findById(req.user?._id).select("+password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      } as ApiResponse);
      return;
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      } as ApiResponse);
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
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
      data: user,
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    } as ApiResponse);
  }
};

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh-token
// @access  Public (secured by refresh token)
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: "Refresh token is required",
      } as ApiResponse);
      return;
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      } as ApiResponse);
      return;
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      } as ApiResponse);
      return;
    }

    const userId = String(user._id);
    const newAccessToken = generateAccessToken(userId);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken,
      },
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    } as ApiResponse);
  }
};
