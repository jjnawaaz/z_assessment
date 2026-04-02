import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/**
 * Middleware to handle express-validator validation results.
 * If validation errors exist, throws a 400 ApiError with formatted errors.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    throw ApiError.badRequest('Validation failed', formattedErrors);
  }

  next();
};

export default validate;
