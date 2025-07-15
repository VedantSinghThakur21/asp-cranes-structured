/**
 * API routes for operators
 */
import express from 'express';
import { getOperators } from '../services/postgres/operatorRepository.js';

const router = express.Router();

const getErrorMessage = (error) => {
  if (error instanceof Error) return error.message;
  return String(error);
};

// Get all operators
router.get('/', async (req, res) => {
  try {
    const operators = await getOperators();
    res.json(operators);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;
