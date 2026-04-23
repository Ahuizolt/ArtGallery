const tagService = require('../services/tag.service');

async function searchGallery(req, res) {
  try {
    const images = await tagService.searchGallery({ q: req.query.q, tags: req.query.tags });
    return res.json(images);
  } catch (err) {
    return res.status(500).json({ error: 'Error en la búsqueda' });
  }
}

async function getAllTags(req, res) {
  try {
    const tags = await tagService.getAllTags();
    return res.json(tags);
  } catch {
    return res.status(500).json({ error: 'Error al obtener etiquetas' });
  }
}

async function getImageTags(req, res) {
  try {
    const tags = await tagService.getImageTags(req.params.imageId);
    return res.json(tags);
  } catch {
    return res.status(500).json({ error: 'Error al obtener etiquetas' });
  }
}

async function setImageTags(req, res) {
  try {
    const { tags } = req.body; // array de strings
    if (!Array.isArray(tags)) return res.status(400).json({ error: 'tags debe ser un array' });
    const result = await tagService.setTagsForImage(req.params.imageId, tags, req.userId);
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { searchGallery, getAllTags, getImageTags, setImageTags };
