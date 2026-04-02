import { body } from 'express-validator';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import sendResponse from '../utils/ApiResponse.js';

/**
 * Validation rules for user update.
 */
export const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('role')
    .optional()
    .isIn(['viewer', 'analyst', 'admin'])
    .withMessage('Role must be viewer, analyst, or admin'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

/**
 * GET /api/users
 * List all users with pagination (Admin only).
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Optional filters
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    sendResponse(res, 200, 'Users retrieved successfully', {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 * Get a single user by ID (Admin only).
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    sendResponse(res, 200, 'User retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id
 * Update user role, status, or name (Admin only).
 */
export const updateUser = async (req, res, next) => {
  try {
    const { name, role, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Prevent admin from deactivating themselves
    if (
      req.user._id.toString() === req.params.id &&
      isActive === false
    ) {
      throw ApiError.badRequest('You cannot deactivate your own account');
    }

    // Prevent admin from demoting themselves
    if (
      req.user._id.toString() === req.params.id &&
      role &&
      role !== 'admin'
    ) {
      throw ApiError.badRequest('You cannot change your own role');
    }

    // Update allowed fields
    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    sendResponse(res, 200, 'User updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id
 * Soft-delete (deactivate) a user (Admin only).
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === req.params.id) {
      throw ApiError.badRequest('You cannot deactivate your own account');
    }

    user.isActive = false;
    await user.save();

    sendResponse(res, 200, 'User deactivated successfully', { user });
  } catch (error) {
    next(error);
  }
};
