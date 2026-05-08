const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PasswordReset = sequelize.define('PasswordReset', {
  email: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
  token_hash: { type: DataTypes.STRING, allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  created_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'password_reset_tokens',
  timestamps: false,
  freezeTableName: true,
});

module.exports = PasswordReset;
