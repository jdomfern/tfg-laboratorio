const Muestra = require('./models/Muestra');

(async () => {
  const muestra = await Muestra.findAll({ raw: true });
  console.log(muestra);
  process.exit(0);
})();
