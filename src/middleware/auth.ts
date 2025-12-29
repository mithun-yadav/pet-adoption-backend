import { Response, NextFunction } from "express";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import User from "../models/User";
import { AuthRequest } from "../types";

// Protect routes - authentication
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

// Generate Access Token (short-lived)
export const generateAccessToken = (id: string): string => {
  const secret = process.env.JWT_SECRET as Secret;
  const expiresIn = (process.env.JWT_ACCESS_EXPIRE ||
    process.env.JWT_EXPIRE ||
    "15m") as SignOptions["expiresIn"];

  const options: SignOptions = { expiresIn };

  return jwt.sign({ id }, secret, options);
};

// Generate Refresh Token (long-lived)
export const generateRefreshToken = (id: string): string => {
  const refreshSecret =
    (process.env.JWT_REFRESH_SECRET as Secret) ||
    (process.env.JWT_SECRET as Secret);
  const expiresIn = (process.env.JWT_REFRESH_EXPIRE ||
    "7d") as SignOptions["expiresIn"];

  const options: SignOptions = { expiresIn };

  return jwt.sign({ id }, refreshSecret, options);
};

// Backwards compatible alias (was previously the only token)
export const generateToken = generateAccessToken;

// Verify refresh token and return user id
export const verifyRefreshToken = (token: string): { id: string } => {
  const refreshSecret =
    (process.env.JWT_REFRESH_SECRET as Secret) ||
    (process.env.JWT_SECRET as Secret);

  return jwt.verify(token, refreshSecret) as { id: string };
};
