const sequelize = require('./config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL correcta');
  } catch (error) {
    console.log('Error al conectar con MySQL:', error.message);
  } finally {
    await sequelize.close();
  }
})();