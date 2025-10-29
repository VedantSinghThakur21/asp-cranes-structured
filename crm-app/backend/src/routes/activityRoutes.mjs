/**
 * API routes for activities
 */
import express from 'express';
import { getRecentActivities } from '../services/activityService.js';

const router = express.Router();

const getErrorMessage = error => {
  if (error instanceof Error) return error.message;
  return String(error);
};

// Get recent activities
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = await getRecentActivities(limit);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;
