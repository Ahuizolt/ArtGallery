const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const imageRoutes = require('./routes/image.routes');
const authMiddleware = require('./middleware/auth.middleware');

const app = express();

app.use(cors());
app.use(express.json());

// Servir imágenes subidas como archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/auth', authRoutes);
app.use('/images', imageRoutes);

// Ruta protegida de ejemplo
app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Acceso autorizado', userId: req.userId });
});

module.exports = app;
