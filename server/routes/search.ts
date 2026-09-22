import { Router, Request, Response } from 'express';
import { getDatabase } from '../db.ts';

const router = Router();

// GET /api/search?q=...
router.get('/', (req: Request, res: Response): void => {
  const query = (req.query.q as string || '').toLowerCase().trim();

  if (!query || query.length < 2) {
    res.json({
      success: true,
      results: {
        notices: [],
        events: [],
        complaints: [],
        lostFound: [],
        resources: [],
      },
    });
    return;
  }

  const db = getDatabase();

  const notices = db.notices
    .filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.description.toLowerCase().includes(query) ||
        n.category.toLowerCase().includes(query) ||
        n.department.toLowerCase().includes(query)
    )
    .slice(0, 5);

  const events = db.events
    .filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.venue.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query) ||
        e.department.toLowerCase().includes(query)
    )
    .slice(0, 5);

  const complaints = db.complaints
    .filter(
      (c) =>
        c.complaintId.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.location.toLowerCase().includes(query)
    )
    .slice(0, 5)
    .map((c) => ({
      _id: c._id,
      complaintId: c.complaintId,
      title: c.title,
      status: c.status,
      category: c.category,
      location: c.location,
    }));

  const lostFound = db.lostFound
    .filter(
      (l) =>
        l.itemName.toLowerCase().includes(query) ||
        l.description.toLowerCase().includes(query) ||
        l.location.toLowerCase().includes(query) ||
        l.category.toLowerCase().includes(query)
    )
    .slice(0, 5);

  const resources = db.resources
    .filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.subject.toLowerCase().includes(query) ||
        r.department.toLowerCase().includes(query) ||
        r.resourceType.toLowerCase().includes(query)
    )
    .slice(0, 5);

  const totalResults =
    notices.length + events.length + complaints.length + lostFound.length + resources.length;

  res.json({
    success: true,
    query,
    totalResults,
    results: {
      notices,
      events,
      complaints,
      lostFound,
      resources,
    },
  });
});

export default router;
