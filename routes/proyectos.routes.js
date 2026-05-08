const express = require('express');
const router = express.Router();
const proyectosController = require('../controllers/proyectosController');
const { soloAdmin } = require('../middleware/authRequired'); //requiero solo la funcion soloAdmin de authRequired

//Todas las rutas protegidas a login con rol administrador
router.get('/proyectos', soloAdmin, proyectosController.getProyectos);
router.get('/proyectos/alta', soloAdmin, proyectosController.getAltaProyecto);
router.post('/proyectos', soloAdmin, proyectosController.postProyecto);
router.get('/proyectos/consulta', soloAdmin, proyectosController.getConsultaProyectos);
router.get('/proyectos/:id/editar', soloAdmin, proyectosController.getEditarProyecto);
router.put('/proyectos/:id', soloAdmin, proyectosController.putEditarProyecto);
router.post('/proyectos/:id/estado', soloAdmin, proyectosController.cambiarEstadoProyecto);

module.exports = router;