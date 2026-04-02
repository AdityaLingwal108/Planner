const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Assessment = sequelize.define('Assessment', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
        // Assignment, Quiz, Exam, Lab, Project
    },
    description: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    weight: {
        type: DataTypes.FLOAT,
        allowNull: false
        // Percentage of course grade e.g. 25 = 25%
    },
    earnedMarks: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null
        // null = student hasn't entered marks yet
    },
    totalMarks: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
        // 'pending' or 'completed'
    },
    CourseId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = Assessment;