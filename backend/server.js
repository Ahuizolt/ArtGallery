require('dotenv').config();
const sequelize = require('./src/models/index');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

sequelize
  .authenticate()
  .then(() => {
    console.log('Conectado a MySQL');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error conectando a la base de datos:', err.message);
    process.exit(1);
  });
