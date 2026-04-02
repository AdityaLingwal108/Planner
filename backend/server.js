const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const sequelize = require('./database');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Import models
const User = require('./models/User');
const Course = require('./models/Course');
const Assessment = require('./models/Assessment');

// Define relationships
User.hasMany(Course, { foreignKey: 'UserId' });
Course.belongsTo(User, { foreignKey: 'UserId' });

Course.hasMany(Assessment, { foreignKey: 'CourseId' });
Assessment.belongsTo(Course, { foreignKey: 'CourseId' });

// Sync database
sequelize.sync({ alter: true })
    .then(() => console.log('Connected to SQLite Database & Tables Synced'))
    .catch((err) => console.error('Database sync error:', err));

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const calculationRoutes = require('./routes/calculations');
app.use('/api', calculationRoutes);

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));