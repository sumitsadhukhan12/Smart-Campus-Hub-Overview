import { Router, Response } from 'express';
import { getDatabase, saveDatabase } from '../db.ts';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth.ts';
import { AcademicResource, ResourceType } from '../../src/types.ts';

const router = Router();

// GET /api/resources
router.get('/', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { department, semester, type, search } = req.query;
  const db = getDatabase();
  let list = [...db.resources];

  if (department && department !== 'All') {
    list = list.filter((r) => r.department.toLowerCase() === (department as string).toLowerCase());
  }

  if (semester && semester !== 'All') {
    list = list.filter((r) => r.semester.toLowerCase() === (semester as string).toLowerCase());
  }

  if (type && type !== 'All') {
    list = list.filter((r) => r.resourceType.toLowerCase() === (type as string).toLowerCase());
  }

  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.resourceType.toLowerCase().includes(q)
    );
  }

  // Sort by newest first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, count: list.length, resources: list });
});

// GET /api/resources/:id/download
router.get('/:id/download', (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const resource = db.resources.find((r) => r._id === req.params.id);

  if (!resource) {
    res.status(404).json({ success: false, message: 'Academic resource not found.' });
    return;
  }

  // Increment download counter
  resource.downloadCount += 1;
  saveDatabase();

  res.json({
    success: true,
    message: 'Download initiated.',
    resource,
    downloadUrl: resource.fileUrl,
    fileName: resource.fileName,
  });
});

// POST /api/resources (Faculty, Admin, or Student)
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const { title, description, subject, department, semester, resourceType, fileName, fileSize, fileUrl } = req.body;

  if (!title || !subject || !department || !resourceType) {
    res.status(400).json({ success: false, message: 'Title, subject, department, and resource type are required.' });
    return;
  }

  const db = getDatabase();
  const newResource: AcademicResource = {
    _id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    description: description ? description.trim() : '',
    subject: subject.trim(),
    department: department.trim(),
    semester: semester || 'All Semesters',
    resourceType: resourceType as ResourceType,
    uploadedBy: {
      id: req.user!._id,
      name: req.user!.fullName,
      role: req.user!.role,
    },
    fileUrl: fileUrl || `https://campus.edu/storage/academic/${encodeURIComponent(title)}.pdf`,
    fileName: fileName || `${title.replace(/\s+/g, '_')}.pdf`,
    fileSize: fileSize || '2.4 MB',
    downloadCount: 0,
    createdAt: new Date().toISOString(),
  };

  db.resources.unshift(newResource);

  db.notifications.unshift({
    _id: `notif_${Date.now()}`,
    userId: 'all',
    title: `New Resource: ${newResource.title}`,
    message: `Added to ${newResource.department} library (${newResource.resourceType}).`,
    type: 'resource',
    link: '/resources',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  saveDatabase();

  res.status(201).json({
    success: true,
    message: 'Resource uploaded and published to campus library.',
    resource: newResource,
  });
});

// DELETE /api/resources/:id
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const index = db.resources.findIndex((r) => r._id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Resource not found.' });
    return;
  }

  const isUploader = db.resources[index].uploadedBy.id === req.user!._id;
  const isAdmin = req.user!.role === 'admin';

  if (!isUploader && !isAdmin) {
    res.status(403).json({ success: false, message: 'Unauthorized to delete this resource.' });
    return;
  }

  db.resources.splice(index, 1);
  saveDatabase();

  res.json({ success: true, message: 'Academic resource removed.' });
});

export default router;
