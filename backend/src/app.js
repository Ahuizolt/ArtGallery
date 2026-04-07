const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const authMiddleware = require('./middleware/auth.middleware');

const app = express();

app.use(cors());
app.use(express.json());

// Auth routes (public)
app.use('/auth', authRoutes);

// Example protected route
app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Acceso autorizado', userId: req.userId });
});

module.exports = app;
