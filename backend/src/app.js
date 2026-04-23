const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const imageRoutes = require('./routes/image.routes');
const boardRoutes = require('./routes/board.routes');
const commentRoutes = require('./routes/comment.routes');
const tagRoutes = require('./routes/tag.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/auth', authRoutes);
app.use('/images/:imageId/comments', commentRoutes);
app.use('/images', imageRoutes);
app.use('/boards', boardRoutes);
app.use('/tags', tagRoutes);

module.exports = app;
