import { Router, Response } from 'express';
import { getDatabase, saveDatabase } from '../db.ts';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.ts';
import { Notice, NoticeCategory, PriorityLevel } from '../../src/types.ts';

const router = Router();

// GET /api/notices
router.get('/', (req: AuthRequest, res: Response): void => {
  const { category, department, search, priority, status } = req.query;
  const db = getDatabase();
  let list = [...db.notices];

  if (category && category !== 'All') {
    list = list.filter((n) => n.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (department && department !== 'All') {
    list = list.filter((n) => n.department === 'All' || n.department.toLowerCase() === (department as string).toLowerCase());
  }

  if (priority && priority !== 'All') {
    list = list.filter((n) => n.priority.toLowerCase() === (priority as string).toLowerCase());
  }

  if (status) {
    list = list.filter((n) => n.status === status);
  } else {
    // Normal users see published notices
    list = list.filter((n) => n.status === 'published');
  }

  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.department.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q)
    );
  }

  // Sort: Pinned first, then newest publishDate
  list.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
  });

  res.json({ success: true, count: list.length, notices: list });
});

// GET /api/notices/:id
router.get('/:id', (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const notice = db.notices.find((n) => n._id === req.params.id);

  if (!notice) {
    res.status(404).json({ success: false, message: 'Notice not found.' });
    return;
  }

  res.json({ success: true, notice });
});

// POST /api/notices (Faculty or Admin)
router.post('/', requireAuth, requireRole(['admin', 'faculty']), (req: AuthRequest, res: Response): void => {
  const { title, description, category, department, expiryDate, priority, isPinned, attachment } = req.body;

  if (!title || !description || !category) {
    res.status(400).json({ success: false, message: 'Title, description, and category are required.' });
    return;
  }

  const db = getDatabase();
  const newNotice: Notice = {
    _id: `not_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    description: description.trim(),
    category: category as NoticeCategory,
    department: department ? department.trim() : 'All',
    publishedBy: {
      id: req.user!._id,
      name: req.user!.fullName,
      role: req.user!.role,
    },
    publishDate: new Date().toISOString(),
    expiryDate: expiryDate || undefined,
    priority: (priority as PriorityLevel) || 'medium',
    isPinned: Boolean(isPinned),
    status: 'published',
    attachment: attachment || undefined,
    createdAt: new Date().toISOString(),
  };

  db.notices.unshift(newNotice);

  // Auto create a notification for all users
  db.notifications.unshift({
    _id: `notif_${Date.now()}`,
    userId: 'all',
    title: `Notice: ${newNotice.title}`,
    message: `${newNotice.category} announcement for ${newNotice.department} department.`,
    type: 'notice',
    link: '/notices',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  saveDatabase();

  res.status(201).json({
    success: true,
    message: 'Notice published successfully!',
    notice: newNotice,
  });
});

// PUT /api/notices/:id
router.put('/:id', requireAuth, requireRole(['admin', 'faculty']), (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const index = db.notices.findIndex((n) => n._id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Notice not found.' });
    return;
  }

  // If faculty, can only update if original publisher or admin
  if (req.user!.role === 'faculty' && db.notices[index].publishedBy.id !== req.user!._id) {
    res.status(403).json({ success: false, message: 'Faculty can only edit notices they published.' });
    return;
  }

  const existing = db.notices[index];
  const { title, description, category, department, expiryDate, priority, isPinned, status, attachment } = req.body;

  db.notices[index] = {
    ...existing,
    title: title !== undefined ? title.trim() : existing.title,
    description: description !== undefined ? description.trim() : existing.description,
    category: category !== undefined ? category : existing.category,
    department: department !== undefined ? department : existing.department,
    expiryDate: expiryDate !== undefined ? expiryDate : existing.expiryDate,
    priority: priority !== undefined ? priority : existing.priority,
    isPinned: isPinned !== undefined ? Boolean(isPinned) : existing.isPinned,
    status: status !== undefined ? status : existing.status,
    attachment: attachment !== undefined ? attachment : existing.attachment,
  };

  saveDatabase();
  res.json({ success: true, message: 'Notice updated successfully.', notice: db.notices[index] });
});

// DELETE /api/notices/:id
router.delete('/:id', requireAuth, requireRole(['admin', 'faculty']), (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const index = db.notices.findIndex((n) => n._id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Notice not found.' });
    return;
  }

  if (req.user!.role === 'faculty' && db.notices[index].publishedBy.id !== req.user!._id) {
    res.status(403).json({ success: false, message: 'Faculty can only delete their own notices.' });
    return;
  }

  db.notices.splice(index, 1);
  saveDatabase();

  res.json({ success: true, message: 'Notice deleted successfully.' });
});

export default router;
