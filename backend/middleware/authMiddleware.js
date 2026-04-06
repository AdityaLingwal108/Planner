const jwt = require('jsonwebtoken');

<<<<<<< HEAD
=======
// Written by Person 1 — do not edit
>>>>>>> 3b783fc94735420146303896b04e722020dc791c
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
<<<<<<< HEAD
            
            req.user = decoded;
            next(); 
=======
            req.user = decoded; // { id, role }
            next();
>>>>>>> 3b783fc94735420146303896b04e722020dc791c
        } catch (error) {
            res.status(401).json({ error: 'Not authorized, token failed.' });
        }
    } else {
        res.status(401).json({ error: 'Not authorized, no token provided.' });
    }
};

module.exports = { protect };