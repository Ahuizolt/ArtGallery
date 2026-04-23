const boardService = require('../services/board.service');

async function getMyBoards(req, res) {
  try {
    const boards = await boardService.getMyBoards(req.userId);
    return res.json(boards);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener tableros' });
  }
}

async function createBoard(req, res) {
  try {
    const { name } = req.body;
    const board = await boardService.createBoard(req.userId, name);
    return res.status(201).json(board);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function saveImage(req, res) {
  try {
    const { boardId } = req.params;
    const { image_id } = req.body;
    if (!image_id) return res.status(400).json({ error: 'image_id es requerido' });
    const result = await boardService.saveImageToBoard(boardId, image_id, req.userId);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function getBoardImages(req, res) {
  try {
    const images = await boardService.getBoardImages(req.params.boardId, req.userId);
    return res.json(images);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function deleteBoard(req, res) {
  try {
    await boardService.deleteBoard(req.params.boardId, req.userId);
    return res.status(204).send();
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { getMyBoards, createBoard, saveImage, getBoardImages, deleteBoard };
