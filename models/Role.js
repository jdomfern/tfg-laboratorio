const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {

  id: { 
    type: DataTypes.BIGINT.UNSIGNED, //Enteros sin negativos
    primaryKey: true, 
    autoIncrement: true //Para que se genere el valor automáticamente
  }, 

  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'roles',
  timestamps: false,
  freezeTableName: true
});

module.exports = Role;