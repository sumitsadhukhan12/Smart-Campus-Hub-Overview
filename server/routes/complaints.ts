import { Router, Response } from 'express';
import { getDatabase, saveDatabase } from '../db.ts';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.ts';
import { Complaint, ComplaintCategory, ComplaintStatus, PriorityLevel } from '../../src/types.ts';

const router = Router();

// GET /api/complaints
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const { category, status, priority, search, scope } = req.query;
  const db = getDatabase();
  const user = req.user!;

  let list = [...db.complaints];

  // If student or user explicitly asked for 'my' complaints:
  if (user.role === 'student' || scope === 'my') {
    list = list.filter((c) => c.submittedBy.id === user._id || c.submittedBy.email === user.email);
  }

  if (category && category !== 'All') {
    list = list.filter((c) => c.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (status && status !== 'All') {
    list = list.filter((c) => c.status.toLowerCase() === (status as string).toLowerCase());
  }

  if (priority && priority !== 'All') {
    list = list.filter((c) => c.priority.toLowerCase() === (priority as string).toLowerCase());
  }

  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(
      (c) =>
        c.complaintId.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }

  // Sort: newest first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, count: list.length, complaints: list });
});

// GET /api/complaints/:id
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const complaint = db.complaints.find((c) => c._id === req.params.id || c.complaintId === req.params.id);

  if (!complaint) {
    res.status(404).json({ success: false, message: 'Complaint record not found.' });
    return;
  }

  // Ensure student only views their own complaint unless admin or faculty
  if (req.user!.role === 'student' && complaint.submittedBy.id !== req.user!._id && complaint.submittedBy.email !== req.user!.email) {
    res.status(403).json({ success: false, message: 'Unauthorized to view this complaint.' });
    return;
  }

  res.json({ success: true, complaint });
});

// POST /api/complaints
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const { title, description, category, location, priority, image } = req.body;

  if (!title || !description || !category || !location) {
    res.status(400).json({ success: false, message: 'Title, description, category, and location are required.' });
    return;
  }

  const db = getDatabase();
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const complaintId = `CMP-${year}-${randomNum}`;
  const now = new Date().toISOString();

  const newComplaint: Complaint = {
    _id: `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    complaintId,
    title: title.trim(),
    description: description.trim(),
    category: category as ComplaintCategory,
    location: location.trim(),
    priority: (priority as PriorityLevel) || 'medium',
    image: image || undefined,
    status: 'Submitted',
    submittedBy: {
      id: req.user!._id,
      name: req.user!.fullName,
      email: req.user!.email,
      collegeId: req.user!.collegeId,
      department: req.user!.department,
    },
    responses: [],
    timeline: [
      {
        status: 'Submitted',
        note: 'Grievance ticket created and assigned to administration queue',
        updatedBy: req.user!.fullName,
        timestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  db.complaints.unshift(newComplaint);

  // Notify admins
  db.notifications.unshift({
    _id: `notif_${Date.now()}`,
    userId: 'admin',
    title: `New Grievance: ${complaintId}`,
    message: `${req.user!.fullName} submitted an issue regarding ${newComplaint.category} at ${newComplaint.location}.`,
    type: 'complaint',
    link: '/complaints',
    isRead: false,
    createdAt: now,
  });

  saveDatabase();

  res.status(201).json({
    success: true,
    message: `Complaint submitted successfully. Ticket ID: ${complaintId}`,
    complaint: newComplaint,
  });
});

// PUT /api/complaints/:id/status (Admin or Faculty)
router.put('/:id/status', requireAuth, requireRole(['admin', 'faculty']), (req: AuthRequest, res: Response): void => {
  const { status, note } = req.body;
  const db = getDatabase();
  const complaint = db.complaints.find((c) => c._id === req.params.id || c.complaintId === req.params.id);

  if (!complaint) {
    res.status(404).json({ success: false, message: 'Complaint not found.' });
    return;
  }

  const validStatuses: ComplaintStatus[] = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, message: 'Invalid complaint status.' });
    return;
  }

  const now = new Date().toISOString();
  complaint.status = status;
  complaint.updatedAt = now;

  complaint.timeline.push({
    status,
    note: note ? note.trim() : `Status updated to ${status}`,
    updatedBy: req.user!.fullName,
    timestamp: now,
  });

  // Notify student
  db.notifications.unshift({
    _id: `notif_${Date.now()}`,
    userId: complaint.submittedBy.id,
    title: `Complaint ${complaint.complaintId} Updated`,
    message: `Status changed to "${status}": ${note || 'Progress update recorded.'}`,
    type: 'complaint',
    link: '/complaints',
    isRead: false,
    createdAt: now,
  });

  saveDatabase();

  res.json({ success: true, message: `Status updated to ${status}`, complaint });
});

// POST /api/complaints/:id/response
router.post('/:id/response', requireAuth, (req: AuthRequest, res: Response): void => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    res.status(400).json({ success: false, message: 'Response message cannot be empty.' });
    return;
  }

  const db = getDatabase();
  const complaint = db.complaints.find((c) => c._id === req.params.id || c.complaintId === req.params.id);

  if (!complaint) {
    res.status(404).json({ success: false, message: 'Complaint not found.' });
    return;
  }

  const now = new Date().toISOString();
  const newResponse = {
    id: `res_${Date.now()}`,
    authorName: req.user!.fullName,
    authorRole: req.user!.role,
    message: message.trim(),
    timestamp: now,
  };

  complaint.responses.push(newResponse);
  complaint.updatedAt = now;

  // Send notification to the other party
  const recipientId = req.user!._id === complaint.submittedBy.id ? 'admin' : complaint.submittedBy.id;
  db.notifications.unshift({
    _id: `notif_${Date.now()}`,
    userId: recipientId,
    title: `Response on ${complaint.complaintId}`,
    message: `${req.user!.fullName}: ${message.trim().substring(0, 80)}...`,
    type: 'complaint',
    link: '/complaints',
    isRead: false,
    createdAt: now,
  });

  saveDatabase();

  res.json({ success: true, message: 'Response posted.', response: newResponse, complaint });
});

export default router;
