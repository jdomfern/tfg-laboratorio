const Proyecto = require('../models/Proyecto');
const { Op } = require('sequelize'); //operador de sequelize

//Carga vista proyecto sin cargar aún info de proyectos, para poder optar previamente por alta o consulta
exports.getProyectos = (req, res) => {
  res.render('proyectos', {
    title: 'Gestión de proyectos',
    modo: null, 
    proyectos: null, //lista de proyectos a consultar
    proyecto: null,  //un unico proyecto para editar
    success: req.query.success || null
  });
};
//Cargar modo alta de proyecto al pulsar alta
exports.getAltaProyecto = (req, res) => {
  res.render('proyectos', {
    title: 'Alta proyecto',
    modo: 'alta',
    proyectos: null,
    proyecto: null,
    success: null
  });
};
//Crea el proyecto en bbdd a partir del formulario
exports.postProyecto = async (req, res) => {
  try {
    const { nombre, descripcion, ubicacion } = req.body;
    await Proyecto.create({nombre, descripcion, ubicacion, activo: true});
    res.redirect('/proyectos?success=created');
  } catch (e) {
    res.status(500).send(`Error creando proyecto: ${e.message}`);
  }
};

//Carga la consulta de proyectos ya en bbdd
exports.getConsultaProyectos = async (req, res) => {
  try {
    const { nombre } = req.query;
    const where = {};
    if (nombre) {where.nombre = { [Op.like]: `%${nombre}%` };} //para filtrar los proyectos que contenga ese nombre 
    const proyectos = await Proyecto.findAll({
      where,
      order: [['id', 'DESC']],
      raw: true
    });
    res.render('proyectos', {
      title: 'Consulta proyectos',
      modo: 'consulta',
      proyectos,
      proyecto: null,
      success: req.query.success || null
    });
  } catch (e) {
    res.status(500).send(`Error consultando proyectos: ${e.message}`);
  }
};

//Cargar un proyecto para editarlo
exports.getEditarProyecto = async (req, res) => {
    try {
      const proyecto = await Proyecto.findByPk(req.params.id, { raw: true }); //busca por su id
      if (!proyecto) {
        return res.status(404).send('Proyecto no encontrado');
      }
      res.render('proyectos', {
        title: 'Editar proyecto',
        modo: 'editar',
        proyectos: null,
        proyecto,
        success: null
      });
    } catch (e) {
      res.status(500).send(`Error cargando proyecto: ${e.message}`);
    }
  };

//Guardar los cambios del formulario de edición
exports.putEditarProyecto = async (req, res) => {
  try {
    const {nombre, descripcion, ubicacion } = req.body;
    await Proyecto.update(
      { nombre, 
        descripcion, 
        ubicacion },
      { where: { id: req.params.id } } //Actualiza estos campos del registro con esa id
    );
    res.redirect('/proyectos/consulta?success=updated');
  } catch (e) {
    res.status(500).send(`Error editando proyecto: ${e.message}`);
  }
};

//Para cambiar de estado el proyecto: de baja a alta o de alta a baja
exports.cambiarEstadoProyecto = async (req, res) => {
  try {
    const proyecto = await Proyecto.findByPk(req.params.id);
    if (!proyecto) return res.status(404).send('Proyecto no encontrado');
    proyecto.activo = !proyecto.activo; //Modifica el campo activo
    await proyecto.save(); //Guarda el cambio en mysql
    res.redirect('/proyectos/consulta?success=estado');
  } catch (e) {
    res.status(500).send(`Error cambiando estado: ${e.message}`);
  }
};