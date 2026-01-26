import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/authorization.js';
import { backlogService } from '../services/backlogService.js';
import { triggerBacklogProcessing } from '../jobs/backlogJob.js';
import { z } from 'zod';
import { startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * GET /api/backlog/entries
 * Get backlog entries for a date range
 */
router.get('/entries', async (req, res) => {
  try {
    const { startDate, endDate, coworkerId } = req.query;

    // Default to current month if no dates provided
    const start = startDate ? parseISO(startDate as string) : startOfMonth(new Date());
    const end = endDate ? parseISO(endDate as string) : endOfMonth(new Date());

    const entries = await backlogService.getBacklogEntries(
      start,
      end,
      coworkerId as string | undefined
    );

    res.json({
      success: true,
      data: entries,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backlog entries',
      error: error.message,
    });
  }
});

/**
 * GET /api/backlog/statistics
 * Get backlog statistics for a date range
 */
router.get('/statistics', async (req, res) => {
  try {
    const { startDate, endDate, coworkerId } = req.query;

    // Default to current month if no dates provided
    const start = startDate ? parseISO(startDate as string) : startOfMonth(new Date());
    const end = endDate ? parseISO(endDate as string) : endOfMonth(new Date());

    const statistics = await backlogService.getBacklogStatistics(
      start,
      end,
      coworkerId as string | undefined
    );

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backlog statistics',
      error: error.message,
    });
  }
});

/**
 * GET /api/backlog/monthly-recap/:month/:year
 * Get monthly recap for a specific month
 */
router.get('/monthly-recap/:month/:year', async (req, res) => {
  try {
    const { month, year } = req.params;

    const recap = await backlogService.getMonthlyRecap(month, parseInt(year));

    if (!recap) {
      return res.status(404).json({
        success: false,
        message: 'Monthly recap not found',
      });
    }

    res.json({
      success: true,
      data: recap,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly recap',
      error: error.message,
    });
  }
});

/**
 * GET /api/backlog/monthly-recap
 * Get all monthly recaps
 */
router.get('/monthly-recap', async (req, res) => {
  try {
    const recaps = await backlogService.getAllMonthlyRecaps();

    res.json({
      success: true,
      data: recaps,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly recaps',
      error: error.message,
    });
  }
});

/**
 * POST /api/backlog/process
 * Manually trigger backlog processing for a date range
 * Requires admin role
 */
router.post('/process', requireAdmin, async (req, res) => {
  try {
    const schema = z.object({
      startDate: z.string(),
      endDate: z.string(),
    });

    const { startDate, endDate } = schema.parse(req.body);

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    await triggerBacklogProcessing(start, end);

    res.json({
      success: true,
      message: 'Backlog processing queued successfully',
      data: {
        startDate,
        endDate,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to trigger backlog processing',
      error: error.message,
    });
  }
});

/**
 * GET /api/backlog/capacity
 * Get remaining monthly capacity
 */
router.get('/capacity', async (req, res) => {
  try {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const statistics = await backlogService.getBacklogStatistics(monthStart, monthEnd);

    const MONTHLY_CAPACITY = 1500;
    const capacityUsed = (statistics.totalHours / MONTHLY_CAPACITY) * 100;

    res.json({
      success: true,
      data: {
        totalCapacity: MONTHLY_CAPACITY,
        usedHours: statistics.totalHours,
        remainingHours: statistics.remainingCapacity,
        capacityUsedPercentage: capacityUsed,
        isOverCapacity: statistics.totalHours > MONTHLY_CAPACITY,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch capacity data',
      error: error.message,
    });
  }
});

export default router;

