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

// Sync SQL Database
sequelize.sync()
    .then(() => console.log('Connected to SQLite Database & Tables Synced'))
    .catch((err) => console.error('Database sync error:', err));

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));