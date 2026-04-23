const express = require('express');
const router = express.Router({ mergeParams: true }); // para acceder a :imageId del padre
const commentController = require('../controllers/comment.controller');
const authMiddleware = require('../middleware/auth.middleware');

// GET comentarios — público
router.get('/', commentController.getComments);

// POST y DELETE — requieren auth
router.post('/', authMiddleware, commentController.addComment);
router.delete('/:commentId', authMiddleware, commentController.deleteComment);

module.exports = router;
