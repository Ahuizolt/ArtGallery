const fs = require('fs');
const path = require('path');
const Image = require('../models/image.model');
const User = require('../models/user.model');
const Tag = require('../models/tag.model');
require('../models/image_tag.model'); // registra asociación

async function saveImage(userId, file, { title, description, is_public }) {
  const image = await Image.create({
    user_id: userId,
    title: title || null,
    description: description || null,
    filename: file.filename,
    original_name: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    is_public: is_public === 'true' || is_public === true,
  });
  return image;
}

async function getMyImages(userId) {
  return Image.findAll({
    where: { user_id: userId },
    order: [['createdAt', 'DESC']],
  });
}

async function getPublicImages() {
  return Image.findAll({
    where: { is_public: true },
    include: [
      { model: User, as: 'owner', attributes: ['username'] },
      { model: Tag, as: 'tags', attributes: ['name'], through: { attributes: [] } },
    ],
    order: [['createdAt', 'DESC']],
  });
}

async function updateImage(imageId, userId, { title, description, is_public }) {
  const image = await Image.findOne({ where: { id: imageId, user_id: userId } });
  if (!image) {
    const err = new Error('Imagen no encontrada');
    err.status = 404;
    throw err;
  }
  await image.update({
    title: title !== undefined ? title : image.title,
    description: description !== undefined ? description : image.description,
    is_public: is_public !== undefined ? (is_public === 'true' || is_public === true) : image.is_public,
  });
  return image;
}

async function deleteImage(imageId, userId) {
  const image = await Image.findOne({ where: { id: imageId, user_id: userId } });
  if (!image) {
    const err = new Error('Imagen no encontrada');
    err.status = 404;
    throw err;
  }
  const filePath = path.join(__dirname, '../../uploads', image.filename);
  await image.destroy();
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

module.exports = { saveImage, getMyImages, getPublicImages, updateImage, deleteImage };
