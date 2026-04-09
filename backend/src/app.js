const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const imageRoutes = require('./routes/image.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Servir imágenes subidas como archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/auth', authRoutes);
app.use('/images', imageRoutes);

module.exports = app;
