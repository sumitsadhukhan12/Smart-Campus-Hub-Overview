import { Router, Response } from 'express';
import { getDatabase, saveDatabase } from '../db.ts';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/notifications
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const user = req.user!;

  const userNotifs = db.notifications.filter(
    (n) =>
      n.userId === 'all' ||
      n.userId === user._id ||
      n.userId === user.role ||
      (user.role === 'admin' && n.userId === 'admin')
  );

  const unreadCount = userNotifs.filter((n) => !n.isRead).length;

  res.json({
    success: true,
    unreadCount,
    notifications: userNotifs.slice(0, 30),
  });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const notif = db.notifications.find((n) => n._id === req.params.id);

  if (!notif) {
    res.status(404).json({ success: false, message: 'Notification not found.' });
    return;
  }

  notif.isRead = true;
  saveDatabase();

  res.json({ success: true, message: 'Notification marked as read.' });
});

// PUT /api/notifications/read-all
router.put('/read-all', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const user = req.user!;

  db.notifications.forEach((n) => {
    if (
      n.userId === 'all' ||
      n.userId === user._id ||
      n.userId === user.role ||
      (user.role === 'admin' && n.userId === 'admin')
    ) {
      n.isRead = true;
    }
  });

  saveDatabase();

  res.json({ success: true, message: 'All notifications marked as read.' });
});

export default router;
