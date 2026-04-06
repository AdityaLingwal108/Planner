const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Course = sequelize.define('Course', {
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    instructor: {
        type: DataTypes.STRING,
        allowNull: false
    },
    term: {
        type: DataTypes.STRING,
        allowNull: false
    },
    credits: {
        type: DataTypes.INTEGER,
        defaultValue: 3
    },
    description: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = Course;