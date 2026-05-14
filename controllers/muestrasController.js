const { Op } = require('sequelize');
const Muestra = require('../models/Muestra');
const Proyecto = require('../models/Proyecto');

//Convierte una fecha a formato válido para input datetime-local indicando hora de España peninsular
function fechaEspañolaParaInput(fecha) {
  return fecha.toLocaleString('sv-SE', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(' ', 'T');
}

//Formatear fecha actual en hora de España peninsular para pasarla como tope en formulario (atributo max)
function ahoraParaInputDatetime() {
  return fechaEspañolaParaInput(new Date());
}
//Convierte la fecha MySQL a formato datetime-local usando hora de España peninsular
function mysqlToDatetimeLocal(fechaMysql) {
  if (!fechaMysql) return '';
  return fechaEspañolaParaInput(new Date(fechaMysql));
}

//Para reemplazar las comas por punto en los decimales y si no esta definido null
function aDecimal(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  return parseFloat(valor.toString().replace(',', '.'));
}

// Convierte "yyyy-mm-ddT18:30" (datetime-local) a "yyyy-mm-dd 18:30:00" 
function convierteDatetime(datetimeLocal) {
  if (!datetimeLocal) return null;
  return datetimeLocal.replace('T', ' ') + ':00';
}

//Obtener formulario de nueva muestra con los proyectos cargados
exports.getNueva = async (req, res) => {
  const proyectos = await Proyecto.findAll({
    where: { activo: true },
    order: [['nombre', 'ASC']],
    raw: true
  });
  res.render('nueva', {
    title: 'Nueva',
    ahora: ahoraParaInputDatetime(),
    proyectos
  });
};

//Procesa los datos cumplimentados en formulario de nueva muestra
exports.postNueva = async (req, res) => {
  try {
    const {
      proyectoId,
      codigo,
      temperatura_agua,
      pH,
      oxigeno_agua,
      conductividad,
      observaciones,
      fecha_hora
    } = req.body;

     // Validar àrámetros
     const oxigeno = aDecimal(oxigeno_agua);
     const temp = aDecimal(temperatura_agua);
     const ph = aDecimal(pH);
     const cond = aDecimal(conductividad);
     if (temp === null || isNaN(temp) || temp < 0 || temp > 50) {
     return res.status(400).send('Error: la temperatura debe estar entre 0 y 50 ºC.');
     }
     if (ph === null || isNaN(ph) || ph < 1 || ph > 14) {
     return res.status(400).send('Error: el pH debe estar entre 1 y 14.');
     }
     if (cond === null || isNaN(cond) || cond < 0 || cond > 50000) {
     return res.status(400).send('Error: la conductividad debe estar entre 0 y 50000 µS/cm max.');
     }
     if (oxigeno === null || isNaN(oxigeno) || oxigeno < 0 || oxigeno > 200) {
     return res.status(400).send('Error: el oxígeno disuelto debe estar entre 0 y 200 % max.');
     }
     // Valida que no se registren muestras futuras y evitar esa trampa
     if (fecha_hora) {
      const fechaMuestra = new Date(fecha_hora);
      if (isNaN(fechaMuestra.getTime())) {
        return res.status(400).send('Error: la fecha introducida no es válida.');
      }
      if (fecha_hora > ahoraParaInputDatetime()) {
        return res.status(400).send('Error: no se puede registrar una muestra con fecha y hora futuras.');
      }
    }
    const proyectoSeleccionado = await Proyecto.findByPk(proyectoId, { raw: true });
    if (!proyectoSeleccionado || !proyectoSeleccionado.activo) {
    return res.status(400).send('Error: debes seleccionar un proyecto activo.');
  }
    const datosMuestra = {
      userId: req.session.user.id,
      proyecto: proyectoSeleccionado.nombre,
      proyectoId,
      codigo,
      temperatura_agua: temp,
      pH: ph,
      oxigeno_agua: oxigeno,
      conductividad: cond,
      observaciones,
      foto_path: req.file ? `/uploads/${req.file.filename}` : null
    };
    const fechaHoraMysql = convierteDatetime(fecha_hora);// Nota: Si fecha_hora viene vacío: MySQL usa CURRENT_TIMESTAMP
    if (fechaHoraMysql) {
      datosMuestra.fecha_hora = fechaHoraMysql;
    }
    await Muestra.create(datosMuestra);
    return res.redirect('/consult?success=created');
  } catch (e) {
    return res.status(500).send(`Error creando muestra: ${e.message}`);
  }
};
//Para consultar las muestras, todas o por código muestra
exports.getConsult = async (req, res) => {
  try {
    const { mostrar_todas, codigo, proyectoId } = req.query;
    let todasLasMuestras = null;
    let resultados = null;
    const filtroUsuario = {};
    if (req.session.user.role === 'tecnico') { // Si es técnico solo puede ver sus muestras
      filtroUsuario.userId = req.session.user.id;
    }
    if (mostrar_todas) {
      todasLasMuestras = await Muestra.findAll({
        where: filtroUsuario, //De las muestras de ese usuario, ordena por id y descendente muestra asi la última arriba
        order: [['id', 'DESC']],
        raw: true
      });
      
    } else if (codigo) { 
      resultados = await Muestra.findAll({
        where: {
          ...filtroUsuario, //spread operator para traer el userId de filtrousuario y ver las muestras de ese userID. El administrador no aporta su userID en el condicional de arriba y no se aplica filtro userID (ve todas) 
          codigo
        },
        order: [['id', 'DESC']],
        raw: true
      });
    } else if (proyectoId) {  //para mostrar las muestras de un proyecto, (where por proyectoId)
      const proyectoSeleccionado = await Proyecto.findByPk(proyectoId, { raw: true });
      if (!proyectoSeleccionado) {
      return res.status(404).send('Proyecto no encontrado');
      }
      resultados = await Muestra.findAll({
        where: {
          ...filtroUsuario,
          [Op.or]: [ //para buscar por id o el nombre del proyecto (para la muestras anteriores que no tenian proyectoId asignado)
            { proyectoId },
            { proyecto: proyectoSeleccionado.nombre }
          ]
        },
        order: [['id', 'DESC']],
        raw: true
      });
    }
    

    return res.render('consult', {
      title: 'Consulta',
      todasLasMuestras,
      resultados,
      success: req.query.success || null
    });
  } catch (e) {
    return res.status(500).send(`Error consultando: ${e.message}`);
  }
};
//Para la obtener la muestra y sus parámetros en la opción de editar 
exports.getEditar = async (req, res) => {
  try {
    const muestra = await Muestra.findByPk(req.params.id, { raw: true });
    if (!muestra) return res.status(404).send('Muestra no encontrada');
    // Si es técnico solo puede editar sus muestras
    if (req.session.user.role === 'tecnico' && Number(muestra.userId) !== Number(req.session.user.id)) {
      return res.status(403).send('No puedes editar una muestra de otro técnico.');
    }
    if (muestra.fecha_hora) {
      muestra.fecha_hora = mysqlToDatetimeLocal(muestra.fecha_hora); //Para convertir la fecha de MySQL al formato datetime-local en hora española peninsular
    }
    const proyectos = await Proyecto.findAll({ //Para cargar los proyectos registrados
      where: { activo: true },
      order: [['nombre', 'ASC']],
      raw: true
    });
    return res.render('editar', { //renderiza la muestra y los proyectos a seleccionar
      title: 'Editar',
      muestra,
      proyectos,
      ahora: ahoraParaInputDatetime()
    });
  } catch (e) {
    return res.status(500).send(`Error cargando editar: ${e.message}`);
  }
};

//Procesa los datos cumplimentados en formulario de editar muestra
exports.putEditar = async (req, res) => {
  try {
    const { id } = req.params;
    const muestra = await Muestra.findByPk(id, { raw: true });
    if (!muestra) return res.status(404).send('Muestra no encontrada');
    // Si es técnico solo puede actualizar sus muestras
    if (req.session.user.role === 'tecnico' && Number(muestra.userId) !== Number(req.session.user.id)) {
      return res.status(403).send('No puedes modificar una muestra de otro técnico.');
    }
    const {
      proyectoId,
      codigo,
      temperatura_agua,
      pH,
      oxigeno_agua,
      conductividad,
      observaciones,
      fecha_hora
    } = req.body;
    // Validar parámetros también al editar
     const oxigeno = aDecimal(oxigeno_agua);
     const temp = aDecimal(temperatura_agua);
     const ph = aDecimal(pH);
     const cond = aDecimal(conductividad);
     if (temp === null || isNaN(temp) || temp < 0 || temp > 50) {
     return res.status(400).send('Error: la temperatura debe estar entre 0 y 50 ºC.');
     }
     if (ph === null || isNaN(ph) || ph < 1 || ph > 14) {
     return res.status(400).send('Error: el pH debe estar entre 1 y 14.');
     }
     if (cond === null || isNaN(cond) || cond < 0 || cond > 50000) {
     return res.status(400).send('Error: la conductividad debe estar entre 0 y 50000 µS/cm max.');
     }
     if (oxigeno === null || isNaN(oxigeno) || oxigeno < 0 || oxigeno > 200) {
     return res.status(400).send('Error: el oxígeno disuelto debe estar entre 0 y 200 % max.');
     }
    if (fecha_hora) {// Validar que no se pueda guardar una fecha futura
      const fechaMuestra = new Date(fecha_hora);
      if (isNaN(fechaMuestra.getTime())) {
        return res.status(400).send('Error: la fecha introducida no es válida.');
      }
      if (fecha_hora > ahoraParaInputDatetime()) {
        return res.status(400).send('Error: no se puede guardar una muestra con fecha y hora futuras.');
      }
    }
    const proyectoSeleccionado = await Proyecto.findByPk(proyectoId, { raw: true }); //
    if (!proyectoSeleccionado || !proyectoSeleccionado.activo) {
    return res.status(400).send('Error: debes seleccionar un proyecto activo.');
    }
    const datosMuestraEditada = {
      proyecto: proyectoSeleccionado.nombre,
      proyectoId,
      codigo,
      temperatura_agua: temp,
      pH: ph,
      oxigeno_agua: oxigeno,
      conductividad: cond,
      observaciones
    };
    const fechaHoraMysql = convierteDatetime(fecha_hora);
    if (fechaHoraMysql) {
      datosMuestraEditada.fecha_hora = fechaHoraMysql;
    }
    if (req.file) {
      datosMuestraEditada.foto_path = `/uploads/${req.file.filename}`;
    }
    await Muestra.update(datosMuestraEditada, { where: { id } });
    return res.redirect('/consult?success=updated');
  } catch (e) {
    return res.status(500).send(`Error actualizando: ${e.message}`);
  }
};
//Para eliminar una muestra registrada
exports.deleteMuestra = async (req, res) => {
  try {
    const { id } = req.body;
    const muestra = await Muestra.findByPk(id, { raw: true });
    if (!muestra) return res.status(404).send('Muestra no encontrada');
    // Si es técnico solo puede eliminar sus muestras
    if (req.session.user.role === 'tecnico' && Number(muestra.userId) !== Number(req.session.user.id)) {
      return res.status(403).send('No puedes eliminar una muestra de otro técnico.');
    }
    await Muestra.destroy({ where: { id } });
    return res.redirect('/consult?success=deleted');
  } catch (e) {
    return res.status(500).send(`Error eliminando: ${e.message}`);
  }
};
