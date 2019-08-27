// obtengo una referencia a la LIBRERIA de mongoose
var mongoose = require('mongoose');

// referencia para la definición de esquemas
var Schema = mongoose.Schema;


/****************************************************************
 * TERCERO: Definición del Modelo del esquema de la colección.
 * 
 ****************************************************************/
// referencia al esquema de la coleccion del esquema 'hospitales'
// nomenclatura nombrado:    <nombre_coleccion_EN_SINGULAR>Schema

// Nota: ref es la refecencia que usa mongoose cuando exportamos el módulo del esquema al final

var hospitalSchema = new Schema({

    nombre: { type: String, required: [true, 'El nombre es un campo obligatorio'] },
    img: { type: String, required: false },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' } // id del usuario
    // para evitar que Mongoose coloque el nombre por defecto (en inglés) a la colección como hospitals,
    // especificamos el nombre
}, { collection: 'hospitales' });

// exportamos el esquema con el nombre 'Hospital'
module.exports = mongoose.model('Hospital', hospitalSchema);