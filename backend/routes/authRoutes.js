const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controllers/authController');

<<<<<<< HEAD
=======
// Written by Person 1 — do not edit
>>>>>>> 3b783fc94735420146303896b04e722020dc791c
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;