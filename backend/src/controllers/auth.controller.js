const authService = require('../services/auth.service');

async function register(req, res) {
  try {
    const { username, email, password } = req.body;
    await authService.createUser(username, email, password);
    return res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Error interno del servidor' : err.message;
    return res.status(status).json({ error: message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const tokens = await authService.loginUser(email, password);
    return res.status(200).json(tokens);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Error interno del servidor' : err.message;
    return res.status(status).json({ error: message });
  }
}

async function refresh(req, res) {
  try {
    const { refresh_token } = req.body;
    const result = await authService.refreshToken(refresh_token);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Error interno del servidor' : err.message;
    return res.status(status).json({ error: message });
  }
}

module.exports = { register, login, refresh };
