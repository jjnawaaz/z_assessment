import { Router } from 'express';
import {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  createRecordValidation,
  updateRecordValidation,
} from '../controllers/record.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import authorize from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Read access — Analyst + Admin
router.get('/', authorize('analyst', 'admin'), getAllRecords);
router.get('/:id', authorize('analyst', 'admin'), getRecordById);

// Write access — Admin only
router.post('/', authorize('admin'), createRecordValidation, validate, createRecord);
router.patch('/:id', authorize('admin'), updateRecordValidation, validate, updateRecord);
router.delete('/:id', authorize('admin'), deleteRecord);

export default router;
