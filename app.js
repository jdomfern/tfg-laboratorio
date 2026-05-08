require('dotenv').config();

const sequelize = require('./config/database');
const { Role } = require('./models'); 
const express = require('express');
const session = require('express-session');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const servidor = http.createServer(app);
const io = new socketIo.Server(servidor);
const authRoutes = require('./routes/auth.routes');
const muestrasRoutes = require('./routes/muestras.routes');
const proyectosRoutes = require('./routes/proyectos.routes');
const informacionRoutes = require('./routes/informacion.routes');
const methodOverride = require('method-override');
// Leer datos enviados en JSON y formularios
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
// Configuración de la sesión 
const sesion = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 15 }
});

app.use(sesion);
// method override para usar PUT y DELETE desde formularios
app.use(methodOverride('_method'));
// Motor de vistas
app.set('view engine', 'ejs');
//Formatear decimales del formulario
app.locals.formateaDecimal = function (valor) {
  if (valor === null || valor === undefined) {
    return '';
  }
  const num = parseFloat(valor);
  // si no tiene decimales, devuelve entero
  if (num % 1 === 0) {
    return num;
  }
  // si tiene decimales, deja 2 max y quitar ceros finales
  let cifra = num.toFixed(2);
  if (cifra.endsWith('00')) {
    cifra = parseInt(num).toString();
  } else if (cifra.endsWith('0')) {
    cifra = cifra.slice(0, -1);
  }
  return cifra;
};
// Usuario logueado en todas las vistas 
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});
//Opción de menú activa
app.use((req, res, next) => {
  // marca qué pestaña está activa según la URL
  const rutaActual = req.path;
  if (rutaActual === '/') res.locals.active = '';
  else if (rutaActual.startsWith('/consult')) res.locals.active = 'consult';
  else if (rutaActual.startsWith('/nueva')) res.locals.active = 'nueva';
  else if (rutaActual.startsWith('/contacto')) res.locals.active = 'contacto';
  else if (rutaActual.startsWith('/navegacion')) res.locals.active = 'navegacion';
  else if (rutaActual.startsWith('/chat')) res.locals.active = 'chat';
  else if (rutaActual.startsWith('/proyectos')) res.locals.active = 'proyectos';
  else if (rutaActual.startsWith('/informacion')) res.locals.active = 'informacion';
  else if (rutaActual.startsWith('/login')) res.locals.active = 'login';
  else if (rutaActual.startsWith('/register')) res.locals.active = 'register';
  else res.locals.active = '';
  next();
});
// Archivos estáticos de carpeta public a usar
app.use(express.static('public'));
// Rutas 
app.use(authRoutes);
app.use(muestrasRoutes);
app.use(proyectosRoutes);
app.use(informacionRoutes);
//Página de inicio
app.get('/', (req, res) => res.render('home'));
//Contacto
app.get('/contacto', (req, res) => {
  res.render('contacto', { title: 'Contacto', active: 'contacto' });
});
//CHAT
//Conectar sesiones a socket.io
io.use((socket, next) => {
  sesion(socket.request, {}, next);
});
// validar usuario logueado
io.use((socket, next) => {
  const sesionUsuario = socket.request.session;
  if (sesionUsuario && sesionUsuario.user) {
    next();
  } else {
    next(new Error('No autorizado'));
  }
});
io.on('connection', (socket) => {
  const usuario = socket.request.session.user.name;
  // Actualizar número de usuarios conectados
  io.emit('num_clientes', io.engine.clientsCount);
  // Recibir un mensaje y reenviarlo a todos los conectados
  socket.on('mensaje_chat', (mensaje) => {
    io.emit('mensaje_chat', {
      usuario,
      mensaje,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });
  // Al salir un usuario, actualizar el contador
  socket.on('disconnect', () => {
    io.emit('num_clientes', io.engine.clientsCount);
  });
});

//Para iniciar la base de datos y crear los roles de los users
async function iniciarBD() {
  try {
    await sequelize.sync(); // crea tablas si no existen
    console.log('Base de datos sincronizada');
    await crearRolesIniciales();
  } catch (error) {
    console.error('Error al iniciar la BD:', error);
  }
}

async function crearRolesIniciales() {
  const roles = ['administrador', 'tecnico'];
  for (const nombre of roles) {
    const existe = await Role.findOne({ where: { nombre } });
    if (!existe) {
      await Role.create({ nombre });
      console.log(`Rol creado: ${nombre}`);
    }
  }
}

const PORT = process.env.PORT || 3000;

iniciarBD().then(() => {
  servidor.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
});

