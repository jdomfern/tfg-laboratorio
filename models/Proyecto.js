const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proyecto = sequelize.define('Proyecto', {

  id: { 
    type: DataTypes.BIGINT.UNSIGNED, //Enteros sin negativos
    primaryKey: true, 
    autoIncrement: true //Para que se genere el valor automáticamente
  }, 
  
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  ubicacion: {
    type: DataTypes.STRING,
    allowNull: true
  },

  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'proyectos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  freezeTableName: true
});

module.exports = Proyecto;