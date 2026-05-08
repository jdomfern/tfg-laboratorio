const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

//Rutas públicas para registro, login, recuperar, cambiar contraseña y desloguear
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/forgot', authController.getForgot);
router.post('/forgot', authController.postForgot);

router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);

router.get('/logout', authController.logout);

module.exports = router;
