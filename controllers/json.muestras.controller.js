const fs = require('fs');
const path = require('path');
const Muestra = require('../models/Muestra');
const Proyecto = require('../models/Proyecto');

//Control para introducir decimales
function aDecimal(valor){
  if(valor === undefined || valor === null || valor === '') return null;
  return parseFloat(valor.toString().replace(',', '.'));
}
//Para sincronizar muestras
exports.postApiMuestra = async (req,res)=>{
  try{
    if (!req.session.user) {
      return res.status(401).json({ ok: false, error: 'Usuario no autorizado.' });
    }
    // Validar que no se registren muestras futuras
    if (req.body.fecha_hora) {
      const fechaMuestra = new Date(req.body.fecha_hora);
      if (isNaN(fechaMuestra.getTime())) {
        return res.status(400).json({ ok: false, error: 'La fecha introducida no es válida.' });
      }
      if (fechaMuestra > new Date()) {
        return res.status(400).json({ ok: false, error: 'No se puede registrar una muestra con fecha y hora futuras.' });
      }
    }
    //Si está ya sincronizada
    if(req.body.offline_id){
      const sincronizada = await Muestra.findOne({
        where:{ offline_id: req.body.offline_id }
      });
      if(sincronizada){
        return res.json({
          ok:true,
          aviso:"ya_sincronizada"
        });
      }
    }
    //Para evitar duplicado de muestras
    const repetida = await Muestra.findOne({
      where:{
        codigo: req.body.codigo,
        fecha_hora: req.body.fecha_hora
      }
    });
    if(repetida){
      return res.json({
        ok:true,
        aviso:"duplicada_codigo_fecha"
      });
    }
    //Para guardar la foto offline
    let foto_path = null;
    if(req.body.foto){
      const base64 = req.body.foto.replace(/^data:image\/\w+;base64,/,""); //Para quitar la cabecera del string de la imagen en base64
      const buffer = Buffer.from(base64,"base64");//convierte el texto base64 otra vez en datos binarios
      const nombre = "offline_" + Date.now() + ".jpg";//para generar un nombre único
      fs.writeFileSync(//para guardar imagen en servidor
        path.join(__dirname,"../public/uploads/"+nombre),
        buffer //la imagen real
      );
      foto_path = "/uploads/" + nombre; //guarda la ruta
    }
    const proyectoSeleccionado = await Proyecto.findByPk(req.body.proyectoId, { raw: true });
    if (!proyectoSeleccionado || !proyectoSeleccionado.activo) {
    return res.status(400).json({
    ok: false,
    error: 'Debes seleccionar un proyecto'
      });
    }
    //Validación de valores de parámetros
    const temp = aDecimal(req.body.temperatura_agua);
    const ph = aDecimal(req.body.pH);
    const cond = aDecimal(req.body.conductividad);
    const oxigeno = aDecimal(req.body.oxigeno_agua);
    if (temp === null || isNaN(temp) || temp < 0 || temp > 50) {
    return res.status(400).json({ ok: false, error: 'La temperatura debe estar entre 0 y 50 ºC.' });
    }
    if (ph === null || isNaN(ph) || ph < 1 || ph > 14) {
    return res.status(400).json({ ok: false, error: 'El pH debe estar entre 1 y 14.' });
    }
    if (cond === null || isNaN(cond) || cond < 0 || cond > 50000) {
    return res.status(400).json({ ok: false, error: 'La conductividad debe estar entre 0 y 50000 µS/cm.' });
    }
    if (oxigeno === null || isNaN(oxigeno) || oxigeno < 0 || oxigeno > 200) {
    return res.status(400).json({ ok: false, error: 'El oxígeno disuelto debe estar entre 0 y 200 %.' });
    }
    //Para crear el registro
    await Muestra.create({
      offline_id: req.body.offline_id || null,
      userId: req.session.user.id,
      proyecto: proyectoSeleccionado.nombre,
      proyectoId: req.body.proyectoId,
      codigo: req.body.codigo,
      temperatura_agua: temp,
      pH: ph,
      oxigeno_agua: oxigeno,
      conductividad: cond,
      observaciones: req.body.observaciones,
      fecha_hora: req.body.fecha_hora || new Date(),
      foto_path
    });
    return res.json({ ok: true });
  }catch(e){
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
};