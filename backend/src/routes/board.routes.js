const express = require('express');
const router = express.Router();
const boardController = require('../controllers/board.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Todas las rutas de tableros requieren autenticación
router.use(authMiddleware);

router.get('/', boardController.getMyBoards);
router.post('/', boardController.createBoard);
router.get('/:boardId/images', boardController.getBoardImages);
router.post('/:boardId/images', boardController.saveImage);
router.delete('/:boardId', boardController.deleteBoard);

module.exports = router;
