const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const User = require('./user.model');
const Image = require('./image.model');

const Comment = sequelize.define(
  'Comment',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    image_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
  },
  { tableName: 'comments', timestamps: true }
);

Image.hasMany(Comment, { foreignKey: 'image_id', onDelete: 'CASCADE' });
Comment.belongsTo(Image, { foreignKey: 'image_id' });

User.hasMany(Comment, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

module.exports = Comment;
