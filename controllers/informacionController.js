/* El controler actualiza las Google Sheets (almacenadas en drive) 
*  mediante Apps Script 
*  y pasa a la vista las URLs 
*  de Looker para mostrarlas en el iframe.*/ 

//URL de Apps Script que actualiza la hoja
const APPS_SCRIPT_EMBALSES_URL = 'https://script.google.com/macros/s/AKfycbzKwgHZ2ZrW5WTxvQLIsjDLtDzrqf5YEsiiPkDi6QdmBtOsHqMxnSD7vX1QPd0Re48j/exec';
const APPS_SCRIPT_RIOS_URL = 'https://script.google.com/macros/s/AKfycbzRlG_d4n7FLDhNbfurxZSrFaS35CRV-rvFguSDAuMsJNXLfbPLLDK0mSt4-qo5x1BaaA/exec';
const APPS_SCRIPT_SUBTERRANEAS_URL = 'https://script.google.com/macros/s/AKfycbyNWMhheOrgQrbDJdVL0ivUdci64qIjiNzdFCbJpGi4WQDKTEQ1gpTxZSqcJEkShG7D/exec';
//URL de Apps Script AEMET que actualiza la hoja
const APPS_SCRIPT_AEMET_URL = 'https://script.google.com/macros/s/AKfycbwMQxnEnGeH7a2OkolatswR2co8EbCmjtv0TDrmvf978suevAHWPdzdEggEnYFcBPDX/exec';

//Para vista información adicional, manda la url del iframe del looker para mostrar 
exports.getInformacion = (req, res) => {
  res.render('informacion', {
    title: 'Información adicional',
    active: 'informacion',
    role: req.session.user.role, // Rol del usuario logueado para mostrar contenido según administrador/técnico
    success: req.query.success || null,
    error: req.query.error || null,
    panel: req.query.panel || '', // Mantiene seleccionado el panel tras recargar la página
    municipio: req.query.municipio || '', //pasa municipio a la vista
    cacheBuster: Date.now(), //forzar recargar iframe (looker tarda 15 minutos como min. en recargar datos)
    //URL del informe interno de Looker Studio con datos de las muestras registradas
    lookerInternoUrl: 'https://datastudio.google.com/embed/reporting/8c94e03c-8d88-4a64-84b3-d939394eef5a',
    // URL de informes de Looker Studio embebidos
    lookerEmbalsesUrl: 'https://datastudio.google.com/embed/reporting/f12ed508-c4f3-4d2d-9008-beb7f8ede1d0',
    lookerRiosUrl: 'https://datastudio.google.com/embed/reporting/329c9fa6-3e23-497c-be56-3bff58d53fa4',
    lookerSubterraneasUrl: 'https://datastudio.google.com/embed/reporting/5bce543b-cbba-42ad-8ee6-295b1a07f0e3',
    lookerAemetUrl: 'https://datastudio.google.com/embed/reporting/7641f0f4-1652-46cc-b58d-ba49fa478ce6'
  });
};
// Función para llamar a Apps Script (que corresponda) cuando le pulsas en actualizar
async function ejecutarAppsScript(url, success, error, panel, res) {
  try {
    const respuesta = await fetch(url); // Llama a Apps Script con su url, que actualiza la hoja Google Sheet (guardada en drive prácticas) desde la API REST de CHG
    if (!respuesta.ok) {
      return res.redirect(`/informacion?error=${error}&panel=${panel}`);
    }
    return res.redirect(`/informacion?success=${success}&panel=${panel}`); //vuelve la información mostrando mensaje éxito
  } catch (e) {
    return res.redirect(`/informacion?error=${error}&panel=${panel}`);
  }
}
/*Función para cargar los datos del municipio 
*en la Apps Script de AEMET
*/
exports.actualizarAemet = async (req, res) => {
  const municipio = req.body.municipio; // Recoge el municipio del formulario
  if (!municipio || municipio.trim() === '') {
    return res.redirect('/informacion?error=municipio-aemet&panel=aemet');
  }
  try {
    // Le pasa el municipio como parámetro a la URL del Apps Script
    const url = `${APPS_SCRIPT_AEMET_URL}?municipio=${encodeURIComponent(municipio.trim())}`;
    const respuesta = await fetch(url); //llamada al script
    const texto = await respuesta.text(); //recoge el texto de la respuesta y si contiene error, vuelve con error
    if (!respuesta.ok || texto.startsWith('ERROR')) {
      const mensaje = texto.replace('ERROR AEMET:', '').trim();
      return res.redirect(`/informacion?error=${encodeURIComponent(mensaje)}&municipio=${encodeURIComponent(municipio.trim())}`);
    }
    //si todo ok, vuelve a la vista mostrando mensaje de éxito y panel aemet del looker studio
    return res.redirect(`/informacion?success=${encodeURIComponent('AEMET ' + municipio.trim())}&panel=aemet&municipio=${encodeURIComponent(municipio.trim())}`);
  } catch (e) {
    return res.redirect(`/informacion?error=aemet&municipio=${encodeURIComponent(municipio.trim())}`);
  }
};

// Actualizar los datos correspondiente dependiendo del botón pulsado (ruta post) (ejecuta la funcion con su url del apps script en concreto)
exports.actualizarEmbalses = async (req, res) => {
  return ejecutarAppsScript(APPS_SCRIPT_EMBALSES_URL, 'embalses', 'embalses', 'embalses', res);
};

exports.actualizarRios = async (req, res) => {
  return ejecutarAppsScript(APPS_SCRIPT_RIOS_URL, 'masas superficiales', 'masas superficiales', 'rios', res);
};

exports.actualizarSubterraneas = async (req, res) => {
  return ejecutarAppsScript(APPS_SCRIPT_SUBTERRANEAS_URL, 'masas subterráneas', 'masas subterráneas', 'subterraneas', res);
};