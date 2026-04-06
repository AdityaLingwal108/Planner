const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const AssessmentCategory = sequelize.define('AssessmentCategory', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
        // e.g. 'Assignment', 'Quiz', 'Exam', 'Lab', 'Project'
    },
    weight: {
        type: DataTypes.FLOAT,
        allowNull: false
        // Percentage of course grade e.g. 25 = 25%
    },
    CourseId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = AssessmentCategory;
