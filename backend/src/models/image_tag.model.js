const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const Image = require('./image.model');
const Tag = require('./tag.model');

const ImageTag = sequelize.define('ImageTag', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  image_id: { type: DataTypes.INTEGER, allowNull: false },
  tag_id: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'image_tags', timestamps: true });

// Relación muchos a muchos
Image.belongsToMany(Tag, { through: ImageTag, foreignKey: 'image_id', as: 'tags' });
Tag.belongsToMany(Image, { through: ImageTag, foreignKey: 'tag_id', as: 'images' });

module.exports = ImageTag;
