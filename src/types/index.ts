import { Request } from 'express';
import { Document } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

// Pet Types
export interface IPet extends Document {
  _id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed: string;
  age: number;
  gender: 'male' | 'female';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  description: string;
  photo?: string;
  status: 'available' | 'pending' | 'adopted';
  vaccinated: boolean;
  neutered: boolean;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Application Types
export interface IApplication extends Document {
  _id: string;
  pet: string;
  user: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  experience: string;
  livingSpace: 'apartment' | 'house' | 'farm';
  hasOtherPets: boolean;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Request with User
export interface AuthRequest extends Request {
  user?: IUser;
}

// Query Types
export interface PetQuery {
  page?: string;
  limit?: string;
  species?: string;
  breed?: string;
  minAge?: string;
  maxAge?: string;
  status?: string;
  search?: string;
}

export interface ApplicationQuery {
  page?: string;
  limit?: string;
  status?: string;
}

// DTO Types
export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface CreatePetDTO {
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed: string;
  age: number;
  gender: 'male' | 'female';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  description: string;
  photo?: string;
  vaccinated?: boolean;
  neutered?: boolean;
}

export interface CreateApplicationDTO {
  petId: string;
  reason: string;
  experience: string;
  livingSpace: 'apartment' | 'house' | 'farm';
  hasOtherPets: boolean;
}

export interface ReviewApplicationDTO {
  status: 'approved' | 'rejected';
  adminNotes?: string;
}

// Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
  errors?: any[];
}

export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
  token: string;
  refreshToken: string;
}