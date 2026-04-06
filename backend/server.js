const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const sequelize = require('./database');

dotenv.config({ path: path.join(__dirname, '.env') });
const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Import models
const User = require('./models/User');
const Course = require('./models/Course');
const Assessment = require('./models/Assessment');
const AssessmentCategory = require('./models/AssessmentCategory');

// Define relationships
User.hasMany(Course, { foreignKey: 'UserId' });
Course.belongsTo(User, { foreignKey: 'UserId' });
Course.hasMany(Assessment, { foreignKey: 'CourseId' });
Assessment.belongsTo(Course, { foreignKey: 'CourseId' });
Course.hasMany(AssessmentCategory, { foreignKey: 'CourseId' });
AssessmentCategory.belongsTo(Course, { foreignKey: 'CourseId' });

// Sync database
sequelize.sync({ alter: true })
    .then(() => console.log('Connected to SQLite Database & Tables Synced'))
    .catch((err) => console.error('Database sync error:', err));

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const calculationRoutes = require('./routes/calculations');
app.use('/api', calculationRoutes);

// Admin auth routes (register/login - no token needed)
const adminAuthRoutes = require('./routes/adminAuthRoutes');
app.use('/api/adminauth', adminAuthRoutes);

// Protected admin routes (requires JWT + admin role)
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Student routes (requires JWT authentication)
const studentRoutes = require('./routes/studentRoutes');
app.use('/api/student', studentRoutes);

// SPA fallback - serve index.html for any unmatched routes
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
