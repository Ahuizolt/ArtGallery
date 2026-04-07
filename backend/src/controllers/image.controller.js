const imageService = require('../services/image.service');

async function upload(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
    const image = await imageService.saveImage(req.userId, req.file, req.body);
    return res.status(201).json(image);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
}

async function getMyImages(req, res) {
  try {
    const images = await imageService.getMyImages(req.userId);
    return res.json(images);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener imágenes' });
  }
}

async function getGallery(req, res) {
  try {
    const images = await imageService.getPublicImages();
    return res.json(images);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener galería' });
  }
}

async function updateImage(req, res) {
  try {
    const image = await imageService.updateImage(req.params.id, req.userId, req.body);
    return res.json(image);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
}

async function deleteImage(req, res) {
  try {
    await imageService.deleteImage(req.params.id, req.userId);
    return res.status(204).send();
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
}

module.exports = { upload, getMyImages, getGallery, updateImage, deleteImage };
