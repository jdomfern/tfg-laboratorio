//Importa la conexión a la base de datos (pool de MySQL/PostgreSQL)
const pool = require('../config/database');
//url del apps script de google sheet
const APPS_SCRIPT_MUESTRAS_URL = 'https://script.google.com/macros/s/AKfycbxqrVBnT__5ia3GHi1tGD_xI4_F8_K2lNP-cMKBn-1rUVMmrvXZyVIWCGSdjc7yOhck/exec';

//Función controlador que se ejecuta cuando llamas a la ruta
exports.exportarMuestrasSheets = async (req, res) => {
  try {
    //Ejecuta consulta sql y devuelve las últimas 200 muestras ordenadas por fecha 
    const [muestras] = await pool.query(`SELECT 
      id,                     
      codigo,                
      proyecto,               
      temperatura_agua,      
      pH,                     
      oxigeno_agua,           
      conductividad,          
      fecha_hora,             
      observaciones           
    FROM muestras_laboratorio
    ORDER BY fecha_hora DESC  
    LIMIT 200                 
    `);
    //Enviar datos a Google Sheets 
    const respuesta = await fetch(APPS_SCRIPT_MUESTRAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(muestras)
      });
      const texto = await respuesta.text();
      //Valida respuesta
      if (!respuesta.ok || texto !== 'OK') {
        throw new Error('Error en Apps Script: ' + texto);
      }
      return res.redirect('/informacion?success=laboratorio');
    } catch (error) {
      console.error(error);
      return res.redirect('/informacion?error=muestras');//Devuelve error 
    }
  };
    