const express = require('express');
const dotenv  = require('dotenv');
const cors    = require('cors');
const path    = require('path');
const sequelize = require('./database');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Import models
const User       = require('./models/User');
const Course     = require('./models/Course');
const Assessment = require('./models/Assessment');

// Define relationships
User.hasMany(Course,         { foreignKey: 'UserId' });
Course.belongsTo(User,       { foreignKey: 'UserId' });
Course.hasMany(Assessment,   { foreignKey: 'CourseId', as: 'Assessments' });
Assessment.belongsTo(Course, { foreignKey: 'CourseId' });

// Sync database
sequelize.sync({ alter: true })
    .then(() => console.log('Database synced.'))
    .catch(err => console.error('Database sync error:', err));

// ── API Routes ────────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/authRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const calcRoutes      = require('./routes/calculations');

app.use('/api/auth',       authRoutes);
app.use('/api/adminauth',  adminAuthRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api',            calcRoutes);      // covers /api/courses, /api/dashboard, /api/gpa

// ── 404 handler for unknown API routes (must be before the SPA catch-all) ────
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found.' });
});

// ── SPA catch-all — serve index.html for all non-API routes ──────────────────
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
