const { DataTypes } = require('sequelize');
const sequelize = require('../database');

<<<<<<< HEAD
=======
// Person 1's model — do not edit auth logic here
>>>>>>> 3b783fc94735420146303896b04e722020dc791c
const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
<<<<<<< HEAD
        validate: {
            isEmail: true
        }
=======
        validate: { isEmail: true }
>>>>>>> 3b783fc94735420146303896b04e722020dc791c
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'student'
    }
});

module.exports = User;