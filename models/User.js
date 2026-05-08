const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { 
    type: DataTypes.BIGINT.UNSIGNED, 
    primaryKey: true, 
    autoIncrement: true 
  },

  name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },

  email: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true 
  },

  password: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },

  roleId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  freezeTableName: true,
});

module.exports = User;
