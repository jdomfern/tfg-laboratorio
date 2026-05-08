const sequelize = require('./config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la BD OK');
    process.exit(0);
  } catch (e) {
    console.error('Fallo BD:', e);
    process.exit(1);
  }
})();
