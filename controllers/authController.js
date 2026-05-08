const bcrypt = require('bcrypt'); //Cifrar contraseñas
const crypto = require('crypto'); //Generar tokens aleatorios
const { User, Role } = require('../models');
const PasswordReset = require('../models/PasswordReset');

// Convierte un texto en hash SHA-256, no guarda el token tal cual
function generarHashSha256(texto) {
  return crypto.createHash('sha256').update(texto).digest('hex');
}

//Se determina que email al registrarse puede tener el rol de administrador
function esEmailAdministrador(email) {
  const emailsAdmin = [
    'director@aqualab.com',
    'administrador@aqualab.com',
    'jefe@aqualab.com',
    'laboratorio@aqualab.com',
    'gestion@aqualab.com'
  ];
  return emailsAdmin.includes(email.toLowerCase());
}

// Mostrar formulario de registro
exports.getRegister = (req, res) => {
  res.render('register', {
    title: 'Registro',
    error: null
  });
};

// Mostrar formulario de login
exports.getLogin = (req, res) => {
  res.render('login', {
    title: 'Login',
    error: null
  });
};

// Procesar registro de usuario
exports.postRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const emailNormalizado = email.toLowerCase();
    // Comprueba si ya existe un usuario con ese email
    const usuarioExistente = await User.findOne({ where: { email: emailNormalizado }, raw: true });
    if (usuarioExistente) {
      return res.render('register', { title: 'Registro', error: 'Ese email ya existe.' });
    }
    //Cifrar contraseña antes de guardarla
    const passwordCifrada = await bcrypt.hash(password, 10);
    //Según el email, se decide el rol automáticamente
    const nombreRol = esEmailAdministrador(emailNormalizado) ? 'administrador' : 'tecnico';
    const rol = await Role.findOne({ where: { nombre: nombreRol } });
    if (!rol) {
      return res.status(500).send('Error: no existen los roles iniciales en la base de datos.');
    }
    const nuevoUsuario = await User.create({
      name,
      email: emailNormalizado,
      password: passwordCifrada,
      roleId: rol.id
    });
    // Iniciar sesión automáticamente tras registrarse
    req.session.user = { id: nuevoUsuario.id, name: nuevoUsuario.name, email: nuevoUsuario.email, role: nombreRol };

    return res.redirect(`/?registro=${nombreRol}`);
  } catch (e) {
    return res.status(500).send(`Error registro: ${e.message}`);
  }
};

// Procesar login
exports.postLogin = async (req, res) => {
  try {
    const { email, password, remember } = req.body;
    const usuario = await User.findOne({ where: { email: email.toLowerCase() }, include: Role });
    if (!usuario) { //Si no existe usuario
      return res.render('login', { title: 'Login', error: 'No existe ese email. Regístrate.' });
    }
    if (!usuario.Role) { //De cara a los usuarios que no tenían rol asignado porque eran anteriores a esta novedad de la web
      const rolTecnico = await Role.findOne({ where: { nombre: 'tecnico' } });
      if (!rolTecnico) {
        return res.status(500).send('Error: no existe el rol técnico en la base de datos.');
      }
      usuario.roleId = rolTecnico.id;
      await usuario.save();  //guarda en bbdd
      usuario.Role = rolTecnico;
    }
    // Comparar contraseña escrita con la guardada cifrada
    const passwordCorrecta = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecta) {
      return res.render('login', {
        title: 'Login', error: 'Contraseña incorrecta.'
      });
    }
    // Si marca "recordarme", la cookie dura 1 día, si no 15 minuto
    if (remember) {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24; // 1 día
    } else {
      req.session.cookie.maxAge = 1000 * 60 * 15; // 15 minutos
    }
    req.session.user = {
      id: usuario.id,
      name: usuario.name,
      email: usuario.email,
      role: usuario.Role.nombre
    };
    return res.redirect('/');
  } catch (e) {
    return res.status(500).send(`Error login: ${e.message}`);
  }
};

// Cerrar sesión
exports.logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).send('Error al cerrar sesión.');
    }
    return res.redirect('/');
  });
};

// Mostrar formulario de recuperación
exports.getForgot = (req, res) => {
  res.render('forgot', { title: 'Recuperar', error: null, info: null });
};

// Generar token temporal para recuperar contraseña
exports.postForgot = async (req, res) => {
  try {
    const {email} = req.body;
    const emailNormalizado = email.toLowerCase();
    const usuario = await User.findOne({ where: { email: emailNormalizado }, raw: true });
    if (!usuario) {//Si no existe usuario
      return res.render('forgot', { title: 'Recuperar', error: 'Ese email no existe.', info: null });
    }
    // Crear token aleatorio corto para que lo copie el usuario
    const tokenPlano = crypto.randomBytes(4).toString('hex');
    // Se guarda el hash del token, no el token (por seguridad )
    const tokenHash = generarHashSha256(tokenPlano);
    // El token caduca en 15 minutos
    const fechaCaducidad = new Date(Date.now() + 1000 * 60 * 15);
    await PasswordReset.upsert({ email: emailNormalizado, token_hash: tokenHash, expires_at: fechaCaducidad, created_at: new Date() });

    return res.render('forgot', {
      title: 'Recuperar', error: null, info: `Contraseña de un único uso (cópiala): ${tokenPlano}
      <a href="/reset" class="btn btn-sm btn-success ms-2">Pincha para cambiar contraseña</a>`
    });
  } catch (e) {
    return res.status(500).send(`Error forgot: ${e.message}`);
  }
};

// Mostrar formulario para cambiar contraseña con token
exports.getReset = (req, res) => {
  res.render('reset', {
    title: 'Reset',
    error: null
  });
};

// Cambiar contraseña usando email + token
exports.postReset = async (req, res) => {
  try {
    const { email, token, new_password } = req.body;
    const emailNormalizado = email.toLowerCase();
    const recuperacion = await PasswordReset.findOne({ 
    where: { email: emailNormalizado, token_hash: generarHashSha256(token)}, 
    raw: true
    });//el token que mete el usuario se vuelve a hashear y se compara con el hash guardado antes en bd. Si coinciden, se autoriza el cambio de contraseña
    if (!recuperacion) {
      return res.render('reset', {
        title: 'Reset',
        error: 'Token inválido.'
      });
    }
    // Comprobar si el token ya ha caducado
    if (new Date(recuperacion.expires_at).getTime() < Date.now()) {
      return res.render('reset', {
        title: 'Reset',
        error: 'Token caducado.'
      });
    }
    // Cifrar la nueva contraseña y actualizar usuario
    const nuevaPasswordCifrada = await bcrypt.hash(new_password, 10);
    await User.update(
      { password: nuevaPasswordCifrada },
      { where: { email: emailNormalizado}}
    );
    // Borrar tokens usados o antiguos de ese email
    await PasswordReset.destroy({ where: { email: emailNormalizado }});
    return res.redirect('/login');
  } catch (e) {
    return res.status(500).send(`Error reset: ${e.message}`);
  }
};



