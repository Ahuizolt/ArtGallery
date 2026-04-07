const express = require('express');
const router = express.Router();
const imageController = require('../controllers/image.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Galería pública — no requiere auth
router.get('/gallery', imageController.getGallery);

// Rutas protegidas
router.use(authMiddleware);

router.post('/', upload.single('image'), imageController.upload);
router.get('/my', imageController.getMyImages);
router.patch('/:id', imageController.updateImage);
router.delete('/:id', imageController.deleteImage);

module.exports = router;
