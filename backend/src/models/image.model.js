const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const User = require('./user.model');

const Image = sequelize.define(
  'Image',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    original_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mimetype: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'images',
    timestamps: true,
  }
);

// Relaciones
User.hasMany(Image, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Image.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

module.exports = Image;
