/*Para comprobar si el 
usuario está logueado
Si hay sesión deja pasar,
si no redirige al login*/  
function requiereLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

/*Para comprobar si el usuario
logueado tiene rol de admnistrador*/
function soloAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  if (req.session.user.role !== 'administrador') {
    return res.status(403).send('Acceso no autorizado');
  }
  next();
}

module.exports = {requiereLogin, soloAdmin };