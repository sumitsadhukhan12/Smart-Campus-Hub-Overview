import { Router, Response } from 'express';
import { optionalAuth, AuthRequest } from '../middleware/auth.ts';
import { askCampusAssistant } from '../gemini.ts';

const router = Router();

// POST /api/ai/assistant
router.post('/assistant', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ success: false, message: 'Question prompt is required.' });
    return;
  }

  try {
    const result = await askCampusAssistant(prompt.trim(), req.user);
    res.json({
      success: true,
      answer: result.answer,
      references: result.references,
    });
  } catch (err: any) {
    console.error('AI assistant error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI assistant inquiry.',
      error: err.message,
    });
  }
});

export default router;
