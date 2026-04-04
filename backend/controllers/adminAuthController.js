const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ADMIN_EMAIL_DOMAIN = '@admin';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.adminRegister = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format.' });
        }
        // Only allow @admin.com emails to register here
        if (!email.includes(ADMIN_EMAIL_DOMAIN)) {
            return res.status(403).json({ error: `Admin accounts must use an ${ADMIN_EMAIL_DOMAIN} email address.` });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'admin'  // always admin here
        });

        res.status(201).json({ message: 'Admin account created successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Server error during admin registration.' });
    }
};

exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        // Block non-admin emails from even trying
        if (!email.includes(ADMIN_EMAIL_DOMAIN)) {
            return res.status(403).json({ error: `Admin login requires an ${ADMIN_EMAIL_DOMAIN} email address.` });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        // Extra check: make sure the DB role is actually admin
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'This account does not have admin privileges.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Admin login successful.',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during admin login.' });
    }
};
