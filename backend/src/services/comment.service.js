const Comment = require('../models/comment.model');
const User = require('../models/user.model');

async function getComments(imageId) {
  return Comment.findAll({
    where: { image_id: imageId },
    include: [{ model: User, as: 'author', attributes: ['username'] }],
    order: [['createdAt', 'ASC']],
  });
}

async function addComment(imageId, userId, text) {
  const trimmed = text?.trim();
  if (!trimmed) {
    const err = new Error('El comentario no puede estar vacío');
    err.status = 400;
    throw err;
  }
  if (trimmed.length > 500) {
    const err = new Error('El comentario no puede superar 500 caracteres');
    err.status = 400;
    throw err;
  }
  const comment = await Comment.create({ image_id: imageId, user_id: userId, text: trimmed });
  // Devolver con el username del autor
  return Comment.findByPk(comment.id, {
    include: [{ model: User, as: 'author', attributes: ['username'] }],
  });
}

async function deleteComment(commentId, userId) {
  const comment = await Comment.findOne({ where: { id: commentId, user_id: userId } });
  if (!comment) {
    const err = new Error('Comentario no encontrado');
    err.status = 404;
    throw err;
  }
  await comment.destroy();
}

module.exports = { getComments, addComment, deleteComment };
