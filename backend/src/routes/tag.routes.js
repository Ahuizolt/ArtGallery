const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tag.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Búsqueda pública
router.get('/search', tagController.searchGallery);

// Todas las etiquetas (para sugerencias)
router.get('/', tagController.getAllTags);

// Etiquetas de una imagen específica
router.get('/image/:imageId', tagController.getImageTags);

// Asignar etiquetas a una imagen (requiere auth)
router.put('/image/:imageId', authMiddleware, tagController.setImageTags);

module.exports = router;
