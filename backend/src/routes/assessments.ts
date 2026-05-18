import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import prisma from '../config/db';

const router = Router();

// Apply auth middleware to all assessment routes
router.use(authenticateToken);

// Get all assessments for the logged-in user
router.get('/', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const assessments = await prisma.assessment.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return res.status(200).json({ assessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Upsert (Create or Update) an assessment
router.post('/', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id, clientName, address, formData, isCompleted } = req.body;

    if (!id || !formData) {
      return res.status(400).json({ error: 'ID and formData are required' });
    }

    const assessment = await prisma.assessment.upsert({
      where: { id },
      update: {
        clientName,
        address,
        formData,
        isCompleted: isCompleted || false,
      },
      create: {
        id,
        userId,
        clientName,
        address,
        formData,
        isCompleted: isCompleted || false,
      },
    });

    return res.status(200).json({ assessment });
  } catch (error) {
    console.error('Error upserting assessment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
