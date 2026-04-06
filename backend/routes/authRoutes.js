const express = require('express');
const router = express.Router();
const { register, login, logout, updateProfile, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Written by Person 1 — do not edit
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Profile management (protected routes)
router.get('/user', protect, getProfile);
router.put('/user', protect, updateProfile);

module.exports = router;