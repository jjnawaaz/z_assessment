import { body } from 'express-validator';
import FinancialRecord from '../models/FinancialRecord.js';
import ApiError from '../utils/ApiError.js';
import sendResponse from '../utils/ApiResponse.js';

/**
 * Validation rules for creating a financial record.
 */
export const createRecordValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number'),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
];

/**
 * Validation rules for updating a financial record.
 */
export const updateRecordValidation = [
  body('amount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number'),
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
];

/**
 * POST /api/records
 * Create a new financial record (Admin only).
 */
export const createRecord = async (req, res, next) => {
  try {
    const { amount, type, category, date, description } = req.body;

    const record = await FinancialRecord.create({
      amount,
      type,
      category,
      date: date || Date.now(),
      description,
      createdBy: req.user._id,
    });

    sendResponse(res, 201, 'Financial record created successfully', { record });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/records
 * List financial records with filtering, sorting, and pagination (Analyst, Admin).
 */
export const getAllRecords = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { isDeleted: false };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        filter.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.date.$lte = new Date(req.query.endDate);
      }
    }

    if (req.query.search) {
      filter.description = { $regex: req.query.search, $options: 'i' };
    }

    // Sorting
    const sortBy = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const [records, total] = await Promise.all([
      FinancialRecord.find(filter)
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      FinancialRecord.countDocuments(filter),
    ]);

    sendResponse(res, 200, 'Financial records retrieved successfully', {
      records,
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
 * GET /api/records/:id
 * Get a single financial record by ID (Analyst, Admin).
 */
export const getRecordById = async (req, res, next) => {
  try {
    const record = await FinancialRecord.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate('createdBy', 'name email');

    if (!record) {
      throw ApiError.notFound('Financial record not found');
    }

    sendResponse(res, 200, 'Financial record retrieved successfully', {
      record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/records/:id
 * Update a financial record (Admin only).
 */
export const updateRecord = async (req, res, next) => {
  try {
    const { amount, type, category, date, description } = req.body;

    const record = await FinancialRecord.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!record) {
      throw ApiError.notFound('Financial record not found');
    }

    // Update allowed fields
    if (amount !== undefined) record.amount = amount;
    if (type !== undefined) record.type = type;
    if (category !== undefined) record.category = category;
    if (date !== undefined) record.date = date;
    if (description !== undefined) record.description = description;

    await record.save();

    sendResponse(res, 200, 'Financial record updated successfully', { record });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/records/:id
 * Soft-delete a financial record (Admin only).
 */
export const deleteRecord = async (req, res, next) => {
  try {
    const record = await FinancialRecord.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!record) {
      throw ApiError.notFound('Financial record not found');
    }

    record.isDeleted = true;
    await record.save();

    sendResponse(res, 200, 'Financial record deleted successfully', { record });
  } catch (error) {
    next(error);
  }
};
