import { Response } from 'express';
import Pet from '../models/Pet';
import { AuthRequest, PetQuery, CreatePetDTO, ApiResponse } from '../types';

// @desc    Get all pets with filters, search and pagination
// @route   GET /api/pets
// @access  Public
export const getPets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', species, breed, minAge, maxAge, status, search }: PetQuery = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};

    // Filter by species
    if (species) {
      query.species = species.toLowerCase();
    }

    // Filter by breed
    if (breed) {
      query.breed = new RegExp(breed, 'i');
    }

    // Filter by age range
    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = parseInt(minAge);
      if (maxAge) query.age.$lte = parseInt(maxAge);
    }

    // Filter by status
    if (status) {
      query.status = status;
    } else {
      query.status = 'available';
    }

    // Search by name or breed
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { breed: new RegExp(search, 'i') }
      ];
    }

    const total = await Pet.countDocuments(query);
    const pets = await Pet.find(query)
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: pets.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: pets
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    } as ApiResponse);
  }
};

// @desc    Get single pet
// @route   GET /api/pets/:id
// @access  Public
export const getPet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pet = await Pet.findById(req.params.id).populate('addedBy', 'name email');

    if (!pet) {
      res.status(404).json({
        success: false,
        message: 'Pet not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: pet
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    } as ApiResponse);
  }
};

// @desc    Create new pet
// @route   POST /api/pets
// @access  Private/Admin
export const createPet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const petData: CreatePetDTO & { addedBy: string } = {
      ...req.body,
      addedBy: req.user!._id
    };

    const pet = await Pet.create(petData);

    res.status(201).json({
      success: true,
      data: pet
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    } as ApiResponse);
  }
};

// @desc    Update pet
// @route   PUT /api/pets/:id
// @access  Private/Admin
export const updatePet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let pet = await Pet.findById(req.params.id);

    if (!pet) {
      res.status(404).json({
        success: false,
        message: 'Pet not found'
      } as ApiResponse);
      return;
    }

    pet = await Pet.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: pet
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    } as ApiResponse);
  }
};

// @desc    Delete pet
// @route   DELETE /api/pets/:id
// @access  Private/Admin
export const deletePet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      res.status(404).json({
        success: false,
        message: 'Pet not found'
      } as ApiResponse);
      return;
    }

    await pet.deleteOne();

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

// @desc    Update pet status
// @route   PATCH /api/pets/:id/status
// @access  Private/Admin
export const updatePetStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;

    if (!['available', 'pending', 'adopted'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status'
      } as ApiResponse);
      return;
    }

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!pet) {
      res.status(404).json({
        success: false,
        message: 'Pet not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: pet
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    } as ApiResponse);
  }
};