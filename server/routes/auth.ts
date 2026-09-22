import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase, saveDatabase } from '../db.ts';
import { generateToken, requireAuth, AuthRequest } from '../middleware/auth.ts';
import { UserRole } from '../../src/types.ts';

const router = Router();

// POST /api/auth/register
router.post('/register', (req: Request, res: Response): void => {
  const {
    fullName,
    collegeId,
    email,
    phone,
    department,
    semester,
    password,
    confirmPassword,
    role,
  } = req.body;

  if (!fullName || !collegeId || !email || !password || !role) {
    res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ success: false, message: 'Passwords do not match.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    return;
  }

  // Security requirement: Do not allow normal users to select Admin during public registration
  if (role === 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin accounts cannot be created via public registration. Contact college super-admin.',
    });
    return;
  }

  const validRoles: UserRole[] = ['student', 'faculty'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ success: false, message: 'Invalid role specified.' });
    return;
  }

  const db = getDatabase();
  const normalizedEmail = email.toLowerCase().trim();

  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    return;
  }

  if (db.users.some((u) => u.collegeId.toLowerCase() === collegeId.toLowerCase().trim())) {
    res.status(409).json({ success: false, message: 'An account with this College ID / Roll Number already exists.' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = {
    _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    fullName: fullName.trim(),
    collegeId: collegeId.trim(),
    email: normalizedEmail,
    phone: phone ? phone.trim() : '',
    department: department ? department.trim() : 'General',
    semester: role === 'student' ? (semester || 'Semester 1') : 'N/A',
    role: role as UserRole,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=0369a1,0284c7,0ea5e9`,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    passwordHash,
  };

  db.users.push(newUser);
  saveDatabase();

  const { passwordHash: _, ...safeUser } = newUser;
  const token = generateToken(safeUser);

  res.status(201).json({
    success: true,
    message: 'Registration successful! Welcome to Smart Campus Hub.',
    token,
    user: safeUser,
  });
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): void => {
  const { identifier, password } = req.body; // email or collegeId

  if (!identifier || !password) {
    res.status(400).json({ success: false, message: 'Please provide both email/college ID and password.' });
    return;
  }

  const db = getDatabase();
  const lower = identifier.toLowerCase().trim();

  const user = db.users.find(
    (u) => u.email.toLowerCase() === lower || u.collegeId.toLowerCase() === lower
  );

  if (!user) {
    res.status(401).json({ success: false, message: 'No account found matching this email or college ID.' });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({ success: false, message: 'This account has been suspended by campus administration.' });
    return;
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ success: false, message: 'Incorrect password entered.' });
    return;
  }

  const { passwordHash: _, ...safeUser } = user;
  const token = generateToken(safeUser);

  res.json({
    success: true,
    message: 'Login successful.',
    token,
    user: safeUser,
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthRequest, res: Response): void => {
  res.json({
    success: true,
    user: req.user,
  });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req: Request, res: Response): void => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: 'Email address is required.' });
    return;
  }

  const db = getDatabase();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) {
    // Standard security: do not leak existence of email
    res.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been dispatched.',
    });
    return;
  }

  res.json({
    success: true,
    message: 'Password reset link sent to your registered campus email.',
    mockResetCode: 'CAMPUS-9042',
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req: Request, res: Response): void => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword || newPassword.length < 6) {
    res.status(400).json({ success: false, message: 'Valid email and new password (min 6 chars) required.' });
    return;
  }

  const db = getDatabase();
  const userIndex = db.users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase().trim());

  if (userIndex === -1) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  db.users[userIndex].passwordHash = bcrypt.hashSync(newPassword, salt);
  saveDatabase();

  res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
});

export default router;
