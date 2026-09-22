import { Router, Response } from 'express';
import { getDatabase, saveDatabase } from '../db.ts';
import { requireAuth, requireRole, optionalAuth, AuthRequest } from '../middleware/auth.ts';
import { EventItem, EventCategory } from '../../src/types.ts';

const router = Router();

// GET /api/events
router.get('/', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { category, filter, search } = req.query;
  const db = getDatabase();
  let list = [...db.events];

  const todayStr = new Date().toISOString().split('T')[0];

  if (category && category !== 'All') {
    list = list.filter((e) => e.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (filter === 'upcoming') {
    list = list.filter((e) => e.date >= todayStr && e.status !== 'cancelled');
  } else if (filter === 'past') {
    list = list.filter((e) => e.date < todayStr || e.status === 'completed');
  }

  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.organizer.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }

  // Sort by event date ascending for upcoming
  list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Attach isUserRegistered if user is authenticated
  const currentUserId = req.user?._id;
  const enhancedList = list.map((e) => {
    const isRegistered = currentUserId
      ? db.eventRegistrations.some(
          (r) => r.eventId === e._id && r.userId === currentUserId && r.status === 'confirmed'
        )
      : false;
    return { ...e, isUserRegistered: isRegistered };
  });

  res.json({ success: true, count: enhancedList.length, events: enhancedList });
});

// GET /api/events/:id
router.get('/:id', optionalAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const event = db.events.find((e) => e._id === req.params.id);

  if (!event) {
    res.status(404).json({ success: false, message: 'Event not found.' });
    return;
  }

  const isRegistered = req.user
    ? db.eventRegistrations.some(
        (r) => r.eventId === event._id && r.userId === req.user!._id && r.status === 'confirmed'
      )
    : false;

  res.json({ success: true, event: { ...event, isUserRegistered: isRegistered } });
});

// POST /api/events (Faculty or Admin)
router.post('/', requireAuth, requireRole(['admin', 'faculty']), (req: AuthRequest, res: Response): void => {
  const {
    title,
    description,
    date,
    startTime,
    endTime,
    venue,
    organizer,
    department,
    category,
    banner,
    registrationDeadline,
    maxParticipants,
  } = req.body;

  if (!title || !description || !date || !venue || !category) {
    res.status(400).json({ success: false, message: 'Title, description, date, venue, and category are required.' });
    return;
  }

  const db = getDatabase();
  const newEvent: EventItem = {
    _id: `eve_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    description: description.trim(),
    date,
    startTime: startTime || '10:00 AM',
    endTime: endTime || '01:00 PM',
    venue: venue.trim(),
    organizer: organizer ? organizer.trim() : req.user!.fullName,
    department: department ? department.trim() : req.user!.department,
    category: category as EventCategory,
    banner:
      banner ||
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    registrationDeadline: registrationDeadline || date,
    maxParticipants: Number(maxParticipants) || 100,
    registeredCount: 0,
    status: 'upcoming',
    createdAt: new Date().toISOString(),
  };

  db.events.push(newEvent);

  db.notifications.unshift({
    _id: `notif_${Date.now()}`,
    userId: 'all',
    title: `New Event: ${newEvent.title}`,
    message: `${newEvent.category} on ${newEvent.date} at ${newEvent.venue}. Registration is open!`,
    type: 'event',
    link: '/events',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  saveDatabase();

  res.status(201).json({
    success: true,
    message: 'Event created successfully!',
    event: newEvent,
  });
});

// PUT /api/events/:id
router.put('/:id', requireAuth, requireRole(['admin', 'faculty']), (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const index = db.events.findIndex((e) => e._id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Event not found.' });
    return;
  }

  const existing = db.events[index];
  const updates = req.body;

  db.events[index] = {
    ...existing,
    ...updates,
    maxParticipants: updates.maxParticipants ? Number(updates.maxParticipants) : existing.maxParticipants,
  };

  saveDatabase();
  res.json({ success: true, message: 'Event updated successfully.', event: db.events[index] });
});

// DELETE /api/events/:id
router.delete('/:id', requireAuth, requireRole(['admin', 'faculty']), (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const index = db.events.findIndex((e) => e._id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Event not found.' });
    return;
  }

  db.events.splice(index, 1);
  saveDatabase();

  res.json({ success: true, message: 'Event removed successfully.' });
});

// POST /api/events/:id/register
router.post('/:id/register', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const event = db.events.find((e) => e._id === req.params.id);

  if (!event) {
    res.status(404).json({ success: false, message: 'Event not found.' });
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (event.registrationDeadline && todayStr > event.registrationDeadline) {
    res.status(400).json({ success: false, message: 'Registration deadline has passed for this event.' });
    return;
  }

  if (event.registeredCount >= event.maxParticipants) {
    res.status(400).json({ success: false, message: 'Event is fully booked. Maximum capacity reached.' });
    return;
  }

  const existingReg = db.eventRegistrations.find(
    (r) => r.eventId === event._id && r.userId === req.user!._id && r.status === 'confirmed'
  );

  if (existingReg) {
    res.status(400).json({ success: false, message: 'You are already registered for this event.' });
    return;
  }

  const newReg = {
    _id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    eventId: event._id,
    userId: req.user!._id,
    userName: req.user!.fullName,
    userEmail: req.user!.email,
    collegeId: req.user!.collegeId,
    registeredAt: new Date().toISOString(),
    status: 'confirmed' as const,
  };

  db.eventRegistrations.push(newReg);
  event.registeredCount += 1;

  db.notifications.unshift({
    _id: `notif_${Date.now()}`,
    userId: req.user!._id,
    title: `Registration Confirmed: ${event.title}`,
    message: `Your seat for ${event.title} is secured. See you on ${event.date} at ${event.venue}!`,
    type: 'event',
    link: '/events',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  saveDatabase();

  res.json({
    success: true,
    message: 'Registered successfully! Seat confirmed.',
    registration: newReg,
    event,
  });
});

// POST /api/events/:id/cancel-registration
router.post('/:id/cancel-registration', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const event = db.events.find((e) => e._id === req.params.id);

  if (!event) {
    res.status(404).json({ success: false, message: 'Event not found.' });
    return;
  }

  const regIndex = db.eventRegistrations.findIndex(
    (r) => r.eventId === event._id && r.userId === req.user!._id && r.status === 'confirmed'
  );

  if (regIndex === -1) {
    res.status(400).json({ success: false, message: 'No active registration found for this event.' });
    return;
  }

  db.eventRegistrations[regIndex].status = 'cancelled';
  event.registeredCount = Math.max(0, event.registeredCount - 1);
  saveDatabase();

  res.json({ success: true, message: 'Registration cancelled.', event });
});

export default router;
