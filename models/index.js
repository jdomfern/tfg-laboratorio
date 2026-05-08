const User = require('./User');
const Role = require('./Role');
const Muestra = require('./Muestra');
const Proyecto = require('./Proyecto');

Role.hasMany(User, { foreignKey: 'roleId' }); //rol tiene muchos usuarios. clave foránea roleid en usuario
User.belongsTo(Role, { foreignKey: 'roleId' });

User.hasMany(Muestra, { foreignKey: 'userId' }); //usuario tiene muchas muestras. clave foránea userId en muestra
Muestra.belongsTo(User, { foreignKey: 'userId' });

Proyecto.hasMany(Muestra, { foreignKey: 'proyectoId' }); //proyecto tiene muchas muestras. clave foránea proyectoId en muestra
Muestra.belongsTo(Proyecto, { foreignKey: 'proyectoId' });

module.exports = { User, Role, Muestra, Proyecto };