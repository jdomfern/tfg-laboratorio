const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requiereLogin } = require('../middleware/authRequired'); //requiero solo la funcion requiereLogin de authRequired
const muestrasController = require('../controllers/muestrasController');
const jsonController = require('../controllers/json.muestras.controller');
const otrasVistasController = require('../controllers/otrasVistasController');

//Como se guarda la imagen del formulario y donde 
const storage = multer.diskStorage({
  destination: (req, file, llamada) => llamada(null, 'public/uploads'),
  filename: (req, file, llamada) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    llamada(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`);
  }
});
//Tamaño y tipo de imagen permitido
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // tamaño de la imagen 10MB como máximo
  fileFilter: (req, file, llamada) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) return llamada(null, true);
    llamada(new Error('Solo se permiten imágenes'));
  }
});

//Rutas protegidas de nueva muestra, consulta y edición
router.get('/nueva', requiereLogin, muestrasController.getNueva);
router.post('/nueva', requiereLogin, upload.single('foto'), muestrasController.postNueva);
router.get('/consult', requiereLogin, muestrasController.getConsult);
router.get('/editar/:id', requiereLogin, muestrasController.getEditar);
//PUT/DELETE con method-override en app.js 
router.put('/editar/:id', requiereLogin, upload.single('foto'), muestrasController.putEditar);
router.delete('/consult', requiereLogin, muestrasController.deleteMuestra);
//Navegacion
router.get('/navegacion', requiereLogin, otrasVistasController.getNavegacion);
//CHAT
router.get('/chat', requiereLogin, otrasVistasController.getChat);
//Para sincronizar muestras guardadas offline
router.post('/sync/muestras', requiereLogin, jsonController.postApiMuestra);
module.exports = router;
