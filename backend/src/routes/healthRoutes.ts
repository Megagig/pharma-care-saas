import express from 'express';
import * as healthController from '../controllers/healthController';

const router = express.Router();

// Health check endpoint - no auth required
router.get('/', healthController.getFeatureFlagSystemStatus);

// Debug authentication endpoint - helps diagnose auth issues
router.get('/debug-token', (req, res) => {
  try {
    // Check both cookie and header for token
    const cookieToken = req.cookies?.accessToken;
    const headerToken = req.header('Authorization')?.replace('Bearer ', '');
    const refreshToken = req.cookies?.refreshToken;

    const response: any = {
      success: true,
      message: 'Authentication debug information',
      tokens: {
        accessTokenInCookie: !!cookieToken,
        accessTokenInHeader: !!headerToken,
        refreshTokenInCookie: !!refreshToken,
      },
      cookies: Object.keys(req.cookies || {}),
      headers: {
        authorization: req.headers.authorization ? 'Present' : 'Not present',
        cookie: req.headers.cookie ? 'Present' : 'Not present',
      }
    };

    if (cookieToken) {
      response.tokens.accessTokenLength = cookieToken.length;
      response.tokens.accessTokenFirstChars = cookieToken.substring(0, 10) + '...';
    }

    res.status(200).json(response);
  } catch (error) {
    res.status(200).json({
      success: false,
      message: 'Error processing auth debug request',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
