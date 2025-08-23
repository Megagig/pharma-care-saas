import express from 'express';
import {
    register,
    login,
    verifyEmail,
    forgotPassword,
    resetPassword,
    refreshToken,
    logout,
    logoutAll,
    getMe,
    updateProfile
} from '../controllers/authController';
import { auth } from '../middlewares/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);

// Protected routes
router.post('/logout', logout);
router.post('/logout-all', logoutAll);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);

export default router;