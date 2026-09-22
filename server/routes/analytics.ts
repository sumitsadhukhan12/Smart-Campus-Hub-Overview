import { Router, Response } from 'express';
import { getAnalyticsData } from '../db.ts';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/analytics
router.get('/', requireAuth, requireRole(['admin', 'faculty']), (req: AuthRequest, res: Response): void => {
  const analytics = getAnalyticsData();
  res.json({ success: true, analytics });
});

export default router;
