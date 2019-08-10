var express = require('express');

// levanto la app
var app = express();

// importar la librería para la encriptación de la password
var bcrypt = require('bcryptjs');

// importar la librería para la generación de un token
var jwt = require('jsonwebtoken');

// definimos la variable exportada del módulo que se encuentra en config.js
var SEED = require('../config/config').SEED;

// arranco el modelo (esquema) de Usuario definido en models/usuario.js
var Usuario = require('../models/usuario');

// ============================================================
//   POST - Envío del email y password para login de usuario
// ============================================================

app.post('/', (req, res) => {

    // 1. Obtenemos el email y password del body de la petición
    var body = req.body;

    // 2. Comprueba si existe un usuario en la BD cuyo email coincide con el email recibido en el body
    Usuario.findOne({ email: body.email }, (err, usuarioBD) => {

        // 2.1 si ocurre algún error
        if (err) {
            return res.status(500).json({ // ERROR GRAVE de Base de Datos
                ok: false,
                mensaje: 'Error al buscar usuarios',
                errors: err
            });
        }

        // 2.2 si no sucede ningún error, evaluamos si existe un usuario con el email enviado
        if (!usuarioBD) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - email',
                errors: err
            });
        }

        // 2.3 Usuario con EMAIL CORRECTO => se procede a verificar la contraseña.
        //     Se compara la password del body con formato string con la password encriptada del usuario encontrado.
        if (!bcrypt.compareSync(body.password, usuarioBD.password)) {

            // 2.3.1 si NO coinciden las contraseñas
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - password ',
                errors: err
            });
        }

        // 2.4 forma alternativa de OCULTAR la CONTRASEÑA ENCRIPTADA despues de guardarlo en BD
        usuarioBD.password = ':)';

        // 2.5 Crear un token para el usuario, firmado con la clave 'SEED'        
        var token = jwt.sign({ usuario: usuarioBD }, SEED, { expiresIn: 14400 }); // 4 horas

        res.status(200).json({ // status 200
            ok: true,
            usuario: usuarioBD,
            token: token,
            id: usuarioBD._id // envío como parte de la respuesta el _id del usuario
        });

    });

});



















// exporto las funciones definidas en este archivo para poderlas utilizar fuera,
// en este caso es la ruta definida por el app
module.exports = app;