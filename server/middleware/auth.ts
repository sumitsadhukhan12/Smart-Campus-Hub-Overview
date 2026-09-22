import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db.ts';
import { User, UserRole } from '../../src/types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'smart-campus-hub-secure-jwt-secret-key-2026';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.fullName,
      collegeId: user.collegeId,
      department: user.department,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const db = getDatabase();
    const found = db.users.find((u) => u._id === decoded.id);

    if (!found) {
      res.status(401).json({ success: false, message: 'Invalid or expired session user.' });
      return;
    }

    if (found.status === 'suspended') {
      res.status(403).json({ success: false, message: 'Account suspended. Contact campus admin.' });
      return;
    }

    const { passwordHash: _, ...safeUser } = found;
    req.user = safeUser as User;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const db = getDatabase();
      const found = db.users.find((u) => u._id === decoded.id);
      if (found && found.status !== 'suspended') {
        const { passwordHash: _, ...safeUser } = found;
        req.user = safeUser as User;
      }
    } catch {
      // Ignore invalid optional token
    }
  }
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Requires one of: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }
    next();
  };
}
