const sequelize = require('../models/index');
const { QueryTypes } = require('sequelize');

async function getMyBoards(userId) {
  return sequelize.query(
    `SELECT b.id, b.name,
            COUNT(bi.id) AS image_count
     FROM boards b
     LEFT JOIN board_images bi ON bi.board_id = b.id
     WHERE b.user_id = :userId
     GROUP BY b.id, b.name
     ORDER BY b.createdAt DESC`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );
}

async function createBoard(userId, name) {
  const trimmed = name.trim();
  if (!trimmed) {
    const err = new Error('El nombre del tablero es requerido');
    err.status = 400;
    throw err;
  }
  const [result] = await sequelize.query(
    'INSERT INTO boards (user_id, name, createdAt, updatedAt) VALUES (:userId, :name, NOW(), NOW())',
    { replacements: { userId, name: trimmed }, type: QueryTypes.INSERT }
  );
  return { id: result, name: trimmed, image_count: 0 };
}

async function saveImageToBoard(boardId, imageId, userId) {
  // Verificar que el tablero pertenece al usuario
  const [board] = await sequelize.query(
    'SELECT id FROM boards WHERE id = :boardId AND user_id = :userId',
    { replacements: { boardId, userId }, type: QueryTypes.SELECT }
  );
  if (!board) {
    const err = new Error('Tablero no encontrado');
    err.status = 404;
    throw err;
  }

  // Verificar que la imagen existe
  const [image] = await sequelize.query(
    'SELECT id FROM images WHERE id = :imageId',
    { replacements: { imageId }, type: QueryTypes.SELECT }
  );
  if (!image) {
    const err = new Error('Imagen no encontrada');
    err.status = 404;
    throw err;
  }

  try {
    await sequelize.query(
      'INSERT INTO board_images (board_id, image_id, createdAt, updatedAt) VALUES (:boardId, :imageId, NOW(), NOW())',
      { replacements: { boardId, imageId }, type: QueryTypes.INSERT }
    );
  } catch (e) {
    // Duplicate entry — imagen ya guardada en este tablero
    if (e.original?.code === 'ER_DUP_ENTRY') {
      const err = new Error('La imagen ya está en este tablero');
      err.status = 409;
      throw err;
    }
    throw e;
  }

  return { message: 'Imagen guardada en el tablero' };
}

async function getBoardImages(boardId, userId) {
  const [board] = await sequelize.query(
    'SELECT id FROM boards WHERE id = :boardId AND user_id = :userId',
    { replacements: { boardId, userId }, type: QueryTypes.SELECT }
  );
  if (!board) {
    const err = new Error('Tablero no encontrado');
    err.status = 404;
    throw err;
  }

  return sequelize.query(
    `SELECT i.id, i.title, i.filename, i.original_name, i.is_public, i.createdAt
     FROM images i
     INNER JOIN board_images bi ON bi.image_id = i.id
     WHERE bi.board_id = :boardId
     ORDER BY bi.createdAt DESC`,
    { replacements: { boardId }, type: QueryTypes.SELECT }
  );
}

async function deleteBoard(boardId, userId) {
  const [result] = await sequelize.query(
    'DELETE FROM boards WHERE id = :boardId AND user_id = :userId',
    { replacements: { boardId, userId }, type: QueryTypes.DELETE }
  );
  if (result?.affectedRows === 0) {
    const err = new Error('Tablero no encontrado');
    err.status = 404;
    throw err;
  }
}

module.exports = { getMyBoards, createBoard, saveImageToBoard, getBoardImages, deleteBoard };
