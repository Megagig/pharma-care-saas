import express from 'express';
import { register, login, forgotPassword, resetPassword, getMe, updateProfile } from '../controllers/authController';
import { auth } from '../middlewares/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);

export default router;