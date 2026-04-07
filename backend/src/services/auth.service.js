const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const SALT_ROUNDS = 10;

function generateAccessToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET || 'access_secret',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

function generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

async function createUser(username, email, password) {
  const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    const err = new Error('El email ya está registrado');
    err.status = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ username, email, password: hashedPassword });
  return user;
}

async function loginUser(email, password) {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  const access_token = generateAccessToken(user.id.toString());
  const refresh_token = generateRefreshToken(user.id.toString());

  return { access_token, refresh_token };
}

async function refreshToken(token) {
  if (!token) {
    const err = new Error('Refresh token requerido');
    err.status = 400;
    throw err;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
  } catch {
    const err = new Error('Refresh token inválido o expirado');
    err.status = 401;
    throw err;
  }

  const access_token = generateAccessToken(decoded.userId);
  return { access_token };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  createUser,
  loginUser,
  refreshToken,
};
