import express from 'express';
import { login, logout, getMe, signup, activate } from './auth.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/activate', activate);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);

export default router;
