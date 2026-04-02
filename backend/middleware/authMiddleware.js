const jwt = require('jsonwebtoken');

// Written by Person 1 — do not edit
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // { id, role }
            next();
        } catch (error) {
            res.status(401).json({ error: 'Not authorized, token failed.' });
        }
    } else {
        res.status(401).json({ error: 'Not authorized, no token provided.' });
    }
};

module.exports = { protect };