const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
<<<<<<< HEAD
    logging: false // Set to console.log to see the raw SQL queries being executed
});

module.exports = sequelize;
=======
    logging: false
});

module.exports = sequelize; 
>>>>>>> 3b783fc94735420146303896b04e722020dc791c
