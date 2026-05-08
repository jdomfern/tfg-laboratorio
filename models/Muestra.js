const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Muestra = sequelize.define('Muestra', {
  
  id: { 
    type: DataTypes.BIGINT.UNSIGNED, //Enteros sin negativos
    primaryKey: true, 
    autoIncrement: true //Para que se genere el valor automáticamente
  }, 

  userId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true
  },
    
  proyectoId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true
  },

  proyecto: {
    type: DataTypes.STRING,
    allowNull: false
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW // Si no se indica: hora actual automáticamente.
  },

  temperatura_agua: {
    type: DataTypes.DECIMAL(4,1),
    allowNull: false
  },
  pH: {
    type: DataTypes.DECIMAL(4,2),
    allowNull: false
  },
  oxigeno_agua: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false
  },
  conductividad: {
    type: DataTypes.DECIMAL(8,2),
    allowNull: false
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  foto_path: {
    type: DataTypes.STRING,
    allowNull: true
  },  
  offline_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
}, {
  tableName: 'muestras_laboratorio',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  freezeTableName: true,
  indexes: [
    {
      unique: true,
      fields: ['codigo', 'fecha_hora']
    }
  ]
});

module.exports = Muestra;
