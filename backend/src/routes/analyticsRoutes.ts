import express from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for analytics endpoints
const analyticsRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many analytics requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(analyticsRateLimit);

// Web Vitals data collection endpoint
router.post('/web-vitals', [
  body('name').isIn(['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'INP']).withMessage('Invalid metric name'),
  body('value').isNumeric().withMessage('Value must be numeric'),
  body('id').isString().withMessage('ID must be a string'),
  body('timestamp').isNumeric().withMessage('Timestamp must be numeric'),
  body('url').isURL().withMessage('URL must be valid'),
  body('userAgent').isString().withMessage('User agent must be a string'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, value, id, timestamp, url, userAgent, connectionType } = req.body;

    // Log Web Vitals data (in production, you'd store this in a database)
    console.log('Web Vitals Data:', {
      name,
      value,
      id,
      timestamp: new Date(timestamp),
      url,
      userAgent,
      connectionType,
      ip: req.ip,
    });

    // Here you would typically:
    // 1. Store the data in a time-series database (e.g., InfluxDB, TimescaleDB)
    // 2. Send to analytics service (e.g., Google Analytics, DataDog)
    // 3. Check against performance budgets and trigger alerts

    // For now, just acknowledge receipt
    res.status(200).json({ 
      success: true, 
      message: 'Web Vitals data received',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing Web Vitals data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Performance alerts endpoint
router.post('/alerts/performance', [
  body('type').isString().withMessage('Alert type is required'),
  body('metric').isString().withMessage('Metric name is required'),
  body('value').isNumeric().withMessage('Value must be numeric'),
  body('budget').isNumeric().withMessage('Budget must be numeric'),
  body('url').isURL().withMessage('URL must be valid'),
  body('timestamp').isNumeric().withMessage('Timestamp must be numeric'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, metric, value, budget, url, timestamp, userAgent, connectionType } = req.body;

    // Log performance alert
    console.warn('Performance Alert:', {
      type,
      metric,
      value,
      budget,
      url,
      timestamp: new Date(timestamp),
      userAgent,
      connectionType,
      ip: req.ip,
    });

    // Here you would typically:
    // 1. Send alert to monitoring system (e.g., PagerDuty, Slack)
    // 2. Store alert in database for tracking
    // 3. Trigger automated responses if needed

    res.status(200).json({ 
      success: true, 
      message: 'Performance alert received',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing performance alert:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get Web Vitals summary endpoint (for dashboard)
router.get('/web-vitals/summary', async (req, res) => {
  try {
    // In a real implementation, you would query your database
    // For now, return mock data
    const summary = {
      period: '24h',
      metrics: {
        FCP: { p50: 1200, p75: 1800, p95: 2400 },
        LCP: { p50: 1800, p75: 2200, p95: 3000 },
        CLS: { p50: 0.05, p75: 0.08, p95: 0.15 },
        FID: { p50: 50, p75: 80, p95: 150 },
        TTFB: { p50: 400, p75: 600, p95: 900 },
      },
      budgetStatus: {
        FCP: 'good',
        LCP: 'needs-improvement',
        CLS: 'good',
        FID: 'good',
        TTFB: 'good',
      },
      totalSamples: 1250,
      lastUpdated: new Date().toISOString(),
    };

    res.json(summary);
  } catch (error) {
    console.error('Error getting Web Vitals summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

export default router;