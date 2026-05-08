//Para vista navegación
exports.getNavegacion = (req, res) => {
    res.render('navegacion', {
      title: 'Navegación',
      active: 'navegacion',
      user: req.session.user
    });
  };
  //Para vista chat
  exports.getChat = (req, res) => {
    res.render('chat', {
      title: 'Chat empleados',
      active: 'chat',
      user: req.session.user
    });
  };