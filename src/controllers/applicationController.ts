import { Response } from 'express';
import Application from '../models/Application';
import Pet from '../models/Pet';
import { AuthRequest, CreateApplicationDTO, ReviewApplicationDTO, ApplicationQuery, ApiResponse } from '../types';

// @desc    Create adoption application
// @route   POST /api/applications
// @access  Private
export const createApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { petId, reason, experience, livingSpace, hasOtherPets }: CreateApplicationDTO = req.body;

    // Check if pet exists and is available
    const pet = await Pet.findById(petId);
    if (!pet) {
      res.status(404).json({
        success: false,
        message: 'Pet not found'
      } as ApiResponse);
      return;
    }

    if (pet.status !== 'available') {
      res.status(400).json({
        success: false,
        message: 'This pet is not available for adoption'
      } as ApiResponse);
      return;
    }

    // Check if user already applied for this pet
    const existingApplication = await Application.findOne({
      pet: petId,
      user: req.user!._id
    });

    if (existingApplication) {
      res.status(400).json({
        success: false,
        message: 'You have already applied for this pet'
      } as ApiResponse);
      return;
    }

    // Create application
    const application = await Application.create({
      pet: petId,
      user: req.user!._id,
      reason,
      experience,
      livingSpace,
      hasOtherPets
    });

    // Update pet status to pending
    await Pet.findByIdAndUpdate(petId, { status: 'pending' });

    const populatedApp = await Application.findById(application._id)
      .populate('pet', 'name species breed')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      data: populatedApp
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    } as ApiResponse);
  }
};

// @desc    Get user's applications
// @route   GET /api/applications/my-applications
// @access  Private
export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const applications = await Application.find({ user: req.user!._id })
      .populate('pet', 'name species breed photo status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    } as ApiResponse);
  }
};

// @desc    Get all applications (Admin)
// @route   GET /api/applications
// @access  Private/Admin
export const getAllApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', status }: ApplicationQuery = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    const total = await Application.countDocuments(query);
    const applications = await Application.find(query)
      .populate('pet', 'name species breed photo')
      .populate('user', 'name email phone address')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: applications
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    } as ApiResponse);
  }
};

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private
export const getApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('pet')
      .populate('user', 'name email phone address')
      .populate('reviewedBy', 'name email');

    if (!application) {
      res.status(404).json({
        success: false,
        message: 'Application not found'
      } as ApiResponse);
      return;
    }

    // Check if user is the owner or admin
    if (application.user.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Not authorized to access this application'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: application
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    } as ApiResponse);
  }
};

// @desc    Review application (Approve/Reject)
// @route   PATCH /api/applications/:id/review
// @access  Private/Admin
export const reviewApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, adminNotes }: ReviewApplicationDTO = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      } as ApiResponse);
      return;
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      res.status(404).json({
        success: false,
        message: 'Application not found'
      } as ApiResponse);
      return;
    }

    if (application.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: 'Application has already been reviewed'
      } as ApiResponse);
      return;
    }

    // Update application
    application.status = status;
    application.adminNotes = adminNotes;
    application.reviewedBy = req.user!._id;
    application.reviewedAt = new Date();
    await application.save();

    // Update pet status
    const pet = await Pet.findById(application.pet);
    if (pet) {
      if (status === 'approved') {
        pet.status = 'adopted';
        
        // Reject all other pending applications for this pet
        await Application.updateMany(
          { pet: application.pet, status: 'pending' },
          { 
            status: 'rejected', 
            adminNotes: 'Pet has been adopted by another applicant',
            reviewedBy: req.user!._id,
            reviewedAt: new Date()
          }
        );
      } else {
        // Check if there are other pending applications
        const pendingCount = await Application.countDocuments({
          pet: application.pet,
          status: 'pending'
        });
        
        // If no pending applications, set pet back to available
        if (pendingCount === 0) {
          pet.status = 'available';
        }
      }
      await pet.save();
    }

    const updatedApplication = await Application.findById(application._id)
      .populate('pet', 'name species breed')
      .populate('user', 'name email')
      .populate('reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      data: updatedApplication
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    } as ApiResponse);
  }
};

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private
export const deleteApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      res.status(404).json({
        success: false,
        message: 'Application not found'
      } as ApiResponse);
      return;
    }

    // Check if user is the owner
    if (application.user.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to delete this application'
      } as ApiResponse);
      return;
    }

    // Can only delete pending applications
    if (application.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: 'Cannot delete reviewed applications'
      } as ApiResponse);
      return;
    }

    await application.deleteOne();

    // Check if there are other pending applications for this pet
    const pendingCount = await Application.countDocuments({
      pet: application.pet,
      status: 'pending'
    });

    // If no pending applications, set pet back to available
    if (pendingCount === 0) {
      await Pet.findByIdAndUpdate(application.pet, { status: 'available' });
    }

    res.status(200).json({
      success: true,
      data: {}
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    } as ApiResponse);
  }
};