const Muestra = require('../models/Muestra');
const Proyecto = require('../models/Proyecto');

//Formatear fecha actual adaptando a UTC para pasarla como tope en formulario (atributo max)
function ahoraParaInputDatetime() {
  const ahora = new Date();
  const offset = ahora.getTimezoneOffset(); //diferencia horaria con la hora UTC en minutos
  const local = new Date(ahora.getTime() - offset * 60000); //Para ajustarla restarle la diferencia en milisegundos entre las dos horas(le sumas al ser resta de un negativo)
  return local.toISOString().slice(0, 16);//recorta la cadena  a la fecha y hora ajustada tras volver a pasar a UTC para formato date-time
}
// Convierte la fecha MySQL a la hora local. (Paso inverso)
function mysqlToDatetimeLocal(fechaMysql) {
  if (!fechaMysql) return '';
  const fecha = new Date(fechaMysql);
  const offset = fecha.getTimezoneOffset(); // diferencia horaria con hora UTC (en minutos)
  const local = new Date(fecha.getTime() - offset * 60000);  // Para ajustar a hora local
  return local.toISOString().slice(0, 16); //recorta la cadena  a la fecha y hora ajustada tras volver a pasar a UTC para formato date-time
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

     // Validar oxígeno disuelto
     const oxigeno = aDecimal(oxigeno_agua);
     if (oxigeno === null || isNaN(oxigeno) || oxigeno < 0 || oxigeno > 200) {
       return res.status(400).send('Error: el oxígeno disuelto debe estar entre 0 y 200 % max.');
     }
    // Valida que no se registren muestras futuras y evitar esa trampa
    if (fecha_hora) {
      const fechaMuestra = new Date(fecha_hora);
      if (isNaN(fechaMuestra.getTime())) {
        return res.status(400).send('Error: la fecha introducida no es válida.');
      }
      if (fechaMuestra > new Date()) {
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
      temperatura_agua: aDecimal(temperatura_agua),
      pH: aDecimal(pH),
      oxigeno_agua: oxigeno,
      conductividad: aDecimal(conductividad),
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
    const { mostrar_todas, codigo } = req.query;
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
      muestra.fecha_hora = mysqlToDatetimeLocal(muestra.fecha_hora); //Para convertir la hora de mysql UTC en la hora local
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
    // Validar oxígeno disuelto también al editar
    const oxigeno = aDecimal(oxigeno_agua);
    if (oxigeno === null || isNaN(oxigeno) || oxigeno < 0 || oxigeno > 200) {
      return res.status(400).send('Error: el oxígeno disuelto debe estar entre 0 y 200 % max.');
    }
    if (fecha_hora) {// Validar que no se pueda guardar una fecha futura
      const fechaMuestra = new Date(fecha_hora);
      if (isNaN(fechaMuestra.getTime())) {
        return res.status(400).send('Error: la fecha introducida no es válida.');
      }
      if (fechaMuestra > new Date()) {
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
      temperatura_agua: aDecimal(temperatura_agua),
      pH: aDecimal(pH),
      oxigeno_agua: oxigeno,
      conductividad: aDecimal(conductividad),
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
