require('dotenv').config();
const { Sequelize } = require('sequelize');

// instancia de conexión (para railway o para local)
const sequelize = new Sequelize(
  process.env.MYSQLDATABASE || process.env.DB_NAME,
  process.env.MYSQLUSER || process.env.DB_USER,
  process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  {
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    port: process.env.MYSQLPORT || process.env.DB_PORT,
    dialect: 'mysql',
    logging: false // desactiva logs SQL en consola
  }
);

// Exportación la conexión
module.exports = sequelize;
