import { Router, Response } from 'express';
import { getDatabase, saveDatabase } from '../db.ts';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.ts';
import { UserRole } from '../../src/types.ts';

const router = Router();

// GET /api/users (Admin only)
router.get('/', requireAuth, requireRole(['admin']), (req: AuthRequest, res: Response): void => {
  const { role, department, search } = req.query;
  const db = getDatabase();

  let list = db.users.map(({ passwordHash: _, ...user }) => user);

  if (role && role !== 'All') {
    list = list.filter((u) => u.role === role);
  }

  if (department && department !== 'All') {
    list = list.filter((u) => u.department.toLowerCase() === (department as string).toLowerCase());
  }

  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.collegeId.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: list.length, users: list });
});

// PUT /api/users/:id/role (Admin only)
router.put('/:id/role', requireAuth, requireRole(['admin']), (req: AuthRequest, res: Response): void => {
  const { role } = req.body;
  const validRoles: UserRole[] = ['student', 'faculty', 'admin'];

  if (!role || !validRoles.includes(role)) {
    res.status(400).json({ success: false, message: 'Valid role required.' });
    return;
  }

  const db = getDatabase();
  const user = db.users.find((u) => u._id === req.params.id);

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  // Prevent demoting the super admin Arthur Vance
  if (user._id === 'usr_admin_1' && role !== 'admin') {
    res.status(400).json({ success: false, message: 'Cannot demote the primary system administrator.' });
    return;
  }

  user.role = role;
  saveDatabase();

  const { passwordHash: _, ...safeUser } = user;
  res.json({ success: true, message: `User role updated to ${role}.`, user: safeUser });
});

// PUT /api/users/:id/status (Admin only)
router.put('/:id/status', requireAuth, requireRole(['admin']), (req: AuthRequest, res: Response): void => {
  const { status } = req.body;

  if (status !== 'active' && status !== 'suspended') {
    res.status(400).json({ success: false, message: 'Status must be active or suspended.' });
    return;
  }

  const db = getDatabase();
  const user = db.users.find((u) => u._id === req.params.id);

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  if (user._id === req.user!._id) {
    res.status(400).json({ success: false, message: 'You cannot suspend your own admin account.' });
    return;
  }

  user.status = status;
  saveDatabase();

  const { passwordHash: _, ...safeUser } = user;
  res.json({ success: true, message: `User account has been ${status}.`, user: safeUser });
});

export default router;
