// obtengo una referencia a la LIBRERIA de mongoose
var mongoose = require('mongoose');

// plugin mongoose-unique-validator
var uniqueValidator = require('mongoose-unique-validator');

// referencia para la definición de esquemas
var Schema = mongoose.Schema;

// enumero los valores permitidos de un campo. Defino el objeto:
var rolesValidos = {
    values: ['ADMIN_ROLE', 'USER_ROLE'],
    message: '{VALUE} no es un rol permitido'
};

// referencia al esquema de la coleccion del esquema 'usuarios'
// nomenclatura nombrado:    <nombre_coleccion_en_singular>Schema

var usuarioSchema = new Schema({

    nombre: { type: String, required: [true, 'El nombre es obligatorio'] },
    email: { type: String, unique: true, required: [true, 'El email es obligatorio'] },
    password: { type: String, required: [true, 'El password es obligatorio'] },
    img: { type: String, required: false },
    role: { type: String, required: [true, 'El rol es obligatorio'], default: 'USER_ROLE', enum: rolesValidos },
    google: { type: Boolean, default: false } // => si fué autenticado por Google: true

});

// aplicamos el validator 'mongoose-unique-validator'
// {PATH} sustituye el nombre del campo
usuarioSchema.plugin(uniqueValidator, { message: 'El {PATH} debe ser único' });

// exportamos el esquema con el nombre 'Usuario'
module.exports = mongoose.model('Usuario', usuarioSchema);