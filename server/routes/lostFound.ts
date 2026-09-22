import { Router, Response } from 'express';
import { getDatabase, saveDatabase } from '../db.ts';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth.ts';
import { LostFoundItem, LostFoundType, LostFoundStatus } from '../../src/types.ts';

const router = Router();

// GET /api/lost-found
router.get('/', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { type, category, status, search } = req.query;
  const db = getDatabase();
  let list = [...db.lostFound];

  if (type && (type === 'lost' || type === 'found')) {
    list = list.filter((item) => item.type === type);
  }

  if (category && category !== 'All') {
    list = list.filter((item) => item.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (status && status !== 'All') {
    list = list.filter((item) => item.status.toLowerCase() === (status as string).toLowerCase());
  }

  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(
      (item) =>
        item.itemName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, count: list.length, items: list });
});

// GET /api/lost-found/:id
router.get('/:id', optionalAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const item = db.lostFound.find((i) => i._id === req.params.id);

  if (!item) {
    res.status(404).json({ success: false, message: 'Lost or found item not found.' });
    return;
  }

  res.json({ success: true, item });
});

// POST /api/lost-found
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const { type, itemName, description, category, date, location, contactInfo, image } = req.body;

  if (!type || !itemName || !description || !category || !location) {
    res.status(400).json({ success: false, message: 'Type, item name, description, category, and location are required.' });
    return;
  }

  const db = getDatabase();
  const newItem: LostFoundItem = {
    _id: `lf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: type as LostFoundType,
    itemName: itemName.trim(),
    description: description.trim(),
    category: category.trim(),
    date: date || new Date().toISOString().split('T')[0],
    location: location.trim(),
    contactInfo: contactInfo || {
      name: req.user!.fullName,
      phone: req.user!.phone,
      email: req.user!.email,
    },
    image: image || undefined,
    status: 'Active',
    postedBy: {
      id: req.user!._id,
      name: req.user!.fullName,
      email: req.user!.email,
    },
    createdAt: new Date().toISOString(),
  };

  db.lostFound.unshift(newItem);

  db.notifications.unshift({
    _id: `notif_${Date.now()}`,
    userId: 'all',
    title: `New ${newItem.type === 'lost' ? 'Lost' : 'Found'} Item: ${newItem.itemName}`,
    message: `Reported at ${newItem.location}. Check the Lost & Found portal to verify or claim.`,
    type: 'lostfound',
    link: '/lost-found',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  saveDatabase();

  res.status(201).json({
    success: true,
    message: `${newItem.type === 'lost' ? 'Lost' : 'Found'} item posted successfully.`,
    item: newItem,
  });
});

// POST /api/lost-found/:id/claim
router.post('/:id/claim', requireAuth, (req: AuthRequest, res: Response): void => {
  const { message } = req.body;
  const db = getDatabase();
  const item = db.lostFound.find((i) => i._id === req.params.id);

  if (!item) {
    res.status(404).json({ success: false, message: 'Item not found.' });
    return;
  }

  if (item.status === 'Returned') {
    res.status(400).json({ success: false, message: 'This item has already been marked as returned.' });
    return;
  }

  item.status = 'Claim Requested';
  item.claimedBy = {
    id: req.user!._id,
    name: req.user!.fullName,
    email: req.user!.email,
    message: message ? message.trim() : 'I believe this item belongs to me.',
    claimedAt: new Date().toISOString(),
  };

  // Notify original poster
  db.notifications.unshift({
    _id: `notif_${Date.now()}`,
    userId: item.postedBy.id,
    title: `Claim Request for ${item.itemName}`,
    message: `${req.user!.fullName} has filed an ownership claim. Review details in Lost & Found.`,
    type: 'lostfound',
    link: '/lost-found',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  saveDatabase();

  res.json({ success: true, message: 'Ownership claim submitted to the finder/poster.', item });
});

// POST /api/lost-found/:id/return
router.post('/:id/return', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const item = db.lostFound.find((i) => i._id === req.params.id);

  if (!item) {
    res.status(404).json({ success: false, message: 'Item not found.' });
    return;
  }

  // Allowed by poster, admin, or claimed user
  const isPoster = item.postedBy.id === req.user!._id;
  const isAdmin = req.user!.role === 'admin';
  const isClaimer = item.claimedBy?.id === req.user!._id;

  if (!isPoster && !isAdmin && !isClaimer) {
    res.status(403).json({ success: false, message: 'Unauthorized to mark this item as returned.' });
    return;
  }

  item.status = 'Returned';
  saveDatabase();

  res.json({ success: true, message: 'Item marked as successfully returned!', item });
});

// DELETE /api/lost-found/:id
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const index = db.lostFound.findIndex((i) => i._id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Item not found.' });
    return;
  }

  const isPoster = db.lostFound[index].postedBy.id === req.user!._id;
  const isAdmin = req.user!.role === 'admin';

  if (!isPoster && !isAdmin) {
    res.status(403).json({ success: false, message: 'Unauthorized to delete this listing.' });
    return;
  }

  db.lostFound.splice(index, 1);
  saveDatabase();

  res.json({ success: true, message: 'Item listing deleted.' });
});

export default router;
