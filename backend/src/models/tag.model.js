const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Tag = sequelize.define('Tag', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
}, { tableName: 'tags', timestamps: true });

module.exports = Tag;
