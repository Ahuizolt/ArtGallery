const commentService = require('../services/comment.service');

async function getComments(req, res) {
  try {
    const comments = await commentService.getComments(req.params.imageId);
    return res.json(comments);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener comentarios' });
  }
}

async function addComment(req, res) {
  try {
    const comment = await commentService.addComment(req.params.imageId, req.userId, req.body.text);
    return res.status(201).json(comment);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function deleteComment(req, res) {
  try {
    await commentService.deleteComment(req.params.commentId, req.userId);
    return res.status(204).send();
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { getComments, addComment, deleteComment };
