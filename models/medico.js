// obtengo una referencia a la LIBRERIA de mongoose
var mongoose = require('mongoose');

// referencia para la definición de esquemas
var Schema = mongoose.Schema;


/****************************************************************
 * TERCERO: Definición del Modelo del esquema de la colección.
 * 
 ****************************************************************/
// referencia al esquema de la coleccion del esquema 'medicos'
// nomenclatura nombrado:    <nombre_coleccion_EN_SINGULAR>Schema

// Nota 1: ref es la refecencia que usa mongoose cuando exportamos el módulo del esquema al final.
// Nota 2: este esquema requiere el usuario que lo creo, como un hospital…
//         solamente son los _id para manejar la relación entre el usuario que lo creo y el
//         hospital al que estamos queriendo asignar al médico.

var medicoSchema = new Schema({

    nombre: { type: String, required: [true, 'El nombre es un campo obligatorio'] },
    img: { type: String, required: false },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: [true, 'El id del usuario es un campo obligatorio'] },
    hospital: { type: Schema.Types.ObjectId, ref: 'Hospital', required: [true, 'El id del hospital es un campo obligatorio'] }
    // para evitar que Mongoose coloque el nombre por defecto (en inglés) a la colección,
    // especificamos el nombre
}, { collection: 'medicos' });

// exportamos el esquema con el nombre 'Hospital'
module.exports = mongoose.model('Medico', medicoSchema);