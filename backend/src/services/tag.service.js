const { Op } = require('sequelize');
const Image = require('../models/image.model');
const Tag = require('../models/tag.model');
const User = require('../models/user.model');
require('../models/image_tag.model'); // registra la asociación

// Normaliza el nombre de etiqueta: minúsculas, sin espacios extra
function normalizeTag(name) {
  return name.toLowerCase().trim().replace(/\s+/g, '-');
}

// Obtener o crear etiquetas y asociarlas a una imagen
async function setTagsForImage(imageId, tagNames, userId) {
  const image = await Image.findOne({ where: { id: imageId, user_id: userId } });
  if (!image) {
    const err = new Error('Imagen no encontrada');
    err.status = 404;
    throw err;
  }

  const normalized = [...new Set(tagNames.map(normalizeTag).filter(Boolean))].slice(0, 10);

  const tags = await Promise.all(
    normalized.map((name) => Tag.findOrCreate({ where: { name } }).then(([tag]) => tag))
  );

  await image.setTags(tags);
  return tags;
}

// Buscar imágenes públicas por título/descripción y/o etiquetas
async function searchGallery({ q, tags }) {
  const where = { is_public: true };
  const tagFilter = tags ? tags.split(',').map((t) => normalizeTag(t)).filter(Boolean) : [];

  const imageWhere = { ...where };
  if (q) {
    imageWhere[Op.or] = [
      { title: { [Op.like]: `%${q}%` } },
      { description: { [Op.like]: `%${q}%` } },
    ];
  }

  const include = [
    { model: User, as: 'owner', attributes: ['username'] },
    { model: Tag, as: 'tags', attributes: ['name'], through: { attributes: [] } },
  ];

  let images = await Image.findAll({ where: imageWhere, include, order: [['createdAt', 'DESC']] });

  // Filtrar por etiquetas si se especificaron
  if (tagFilter.length > 0) {
    images = images.filter((img) =>
      tagFilter.every((t) => img.tags.some((tag) => tag.name === t))
    );
  }

  return images;
}

// Obtener todas las etiquetas existentes (para sugerencias)
async function getAllTags() {
  return Tag.findAll({ attributes: ['id', 'name'], order: [['name', 'ASC']] });
}

// Obtener etiquetas de una imagen
async function getImageTags(imageId) {
  const image = await Image.findByPk(imageId, {
    include: [{ model: Tag, as: 'tags', attributes: ['id', 'name'], through: { attributes: [] } }],
  });
  return image ? image.tags : [];
}

module.exports = { setTagsForImage, searchGallery, getAllTags, getImageTags };
