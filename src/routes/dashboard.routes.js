import { Router } from 'express';
import {
  getSummary,
  getCategorySummary,
  getTrends,
  getRecentActivity,
} from '../controllers/dashboard.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import authorize from '../middleware/role.middleware.js';

const router = Router();

// All dashboard routes require analyst or admin access
router.use(authenticate, authorize('analyst', 'admin'));

router.get('/summary', getSummary);
router.get('/category-summary', getCategorySummary);
router.get('/trends', getTrends);
router.get('/recent', getRecentActivity);

export default router;
