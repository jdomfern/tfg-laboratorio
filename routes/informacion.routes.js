const express = require('express');
const router = express.Router();
const informacionController = require('../controllers/informacionController');
const muestrasSheetsController = require('../controllers/muestrasSheetsController');
const { requiereLogin, soloAdmin } = require('../middleware/authRequired');

//rutas protegidas con login (tb algunas restringidas a admin) para acceder a información
router.get('/informacion', requiereLogin, informacionController.getInformacion);
router.post('/informacion/chg/embalses', soloAdmin, informacionController.actualizarEmbalses);
router.post('/informacion/chg/rios', soloAdmin, informacionController.actualizarRios);
router.post('/informacion/chg/subterraneas', soloAdmin, informacionController.actualizarSubterraneas);
router.post('/informacion/aemet', requiereLogin, informacionController.actualizarAemet);
router.post('/informacion/muestras/exportar', soloAdmin, muestrasSheetsController.exportarMuestrasSheets); //para exportar datos muestras a google sheets para hacer gráficos looker studio
module.exports = router;