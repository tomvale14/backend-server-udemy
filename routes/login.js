var express = require('express');

// levanto la app
var app = express();

// importar la librería para la encriptación de la password
var bcrypt = require('bcryptjs');

// importar la librería para la generación de un token
var jwt = require('jsonwebtoken');

// definimos la variable exportada del módulo que se encuentra en config/config.js
var SEED = require('../config/config').SEED;

// arranco el modelo (esquema) de Usuario definido en models/usuario.js
var Usuario = require('../models/usuario');

// *** Google ***

// definimos la variable exportada del módulo que se encuentra en config/config.js
var CLIENT_ID = require('../config/config').CLIENT_ID;

// desestructura la clase OAuth2Client de la librería google-auth-library
const { OAuth2Client } = require('google-auth-library');

// constante con el cliente de OAuth2
const client = new OAuth2Client(CLIENT_ID);

// ============================================================
//    Función de Atenticación por token de Usuario de Google
// ============================================================
/**
 * Función de verificación del token de usuario de Google.
 * The verifyIdToken function verifies the JWT signature, the aud claim, the exp claim, and the iss claim.
 * If you want to restrict access to only members of your G Suite domain, also verify the hd claim matches your G Suite domain name.
 * 
 * @param token token de usuario
 */
async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });

    // el payload contiene toda la información del usuario
    const payload = ticket.getPayload();

    // const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];

    // Estructura del objeto devuelto del usuario de Google
    return {
        nombre: payload.name, // campo: valor
        email: payload.email,
        img: payload.picture,
        google: true // es un usuario de Google
            // payload: payload
    }
}

// ============================================================================
//          *** AUTENTICACIÓN POR TOKEN DE GOOGLE *** 
//  POST - Llamada a la Función de Verificación del token de usuario de Google 
// ============================================================================

// 1. Verifica el token de usuario de Google
//   => para poder utilizar 'await' es obligatorio que se ejecute dentro de una función 'async'
app.post('/google', async(req, res) => {

    // 1.1 Obtenemos el contenido del parámetro 'token' de la petición
    let token = req.body.token; // => req.body.token es el nombre que ponemos como parámetro en el boby de la petición

    // 1.2 Llama a la función verify(token) para comprobar si el token es válido
    // antes de asignar un valor a la variable 'googleUser', debe esperar al resultado de la función 'verify', la cual devuelve una promesa
    let googleUser = await verify(token)
        .catch(error => {

            // => si NO es válido
            return res.status(403).json({ // error 403: Forbidden al devolver la promesa de verificación del token
                ok: false,
                mensaje: 'Token de Google no válido',
                errors: { message: 'Token de google no válido' }
            });

        });

    // 2. El token es válido
    //    => Busca un usuario en la BD cuyo email coincide con el email recibido en el usuario del objeto de Google.
    //    => busca por el email: puede recibir un error o un usuario de la Base de Datos.
    Usuario.findOne({ email: googleUser.email }, (err, usuarioBD) => {

        // 2.1 si ocurre algún error en la búsqueda del usuario en la BD
        if (err) {
            return res.status(500).json({ // ERROR GRAVE de Base de Datos
                ok: false,
                mensaje: 'Error al buscar usuarios',
                errors: err
            });
        }

        // 2.2 si no sucede ningún error,
        //     => evaluamos si EXISTE un usuarioBD con el email enviado:

        // *** USUARIO SI EXISTE EN LA BD ***
        if (usuarioBD) { // 

            // 2.2.1 Comprueba si es un usuario autenticado por Google
            //       => si la propiedad del esquema de usuarios google es false,
            //          quiere decir que el usuario NO fue autenticado por Google
            if (usuarioBD.google === false) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Debe utilizar la autenticación normal: email/password'
                });

                // 2.2.2 El usuario existe en la BD y SI fue autenticado por Google
            } else {

                // 2.2.2.1 Generar un NUEVO TOKEN para el usuario, firmado con la clave 'SEED'        
                let token = jwt.sign({ usuario: usuarioBD }, SEED, { expiresIn: 14400 }); // 4 horas

                // 2.2.2.2 Enviar la RESPUESTA
                return res.status(200).json({ // status 200
                    ok: true,
                    usuario: usuarioBD,
                    token: token, // ESTE TOKEN ES EL QUE TIENE QUE USAR EL USAURIO PARA TRABAJAR CON LA APLICACIÓN
                    id: usuarioBD._id // envío como parte de la respuesta el _id del usuario
                });
            }

            // *** 2.3 USUARIO NO EXISTE EN LA BD => es la primera vez que se autentica ***
        } else {

            // 2.3.1 Creamos una nueva instancia de Usuario
            let usuario = new Usuario();

            // 2.3.2 Establecer los valores de la nueva instancia
            usuario.nombre = googleUser.nombre;
            usuario.email = googleUser.email;
            usuario.img = googleUser.img;
            usuario.google = true; // es un usuario de Google
            usuario.password = ':)'; // es obligatorio. Si se autentica de forma normal, esta instrucción no se ejecuta

            // 2.3.3 Guarda el registro en la Base de Datos
            usuario.save((err, usuarioBD) => {
                // 2.3.3.1 si se produce algún error al guardar el 'usuario'
                if (err) { // ERROR de Base de Datos
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al grabar el usuario de Google en la BD',
                        errors: err
                    });
                }

                // 2.3.3.2 si NO se produce ningún error al guardar el 'usuario'
                //         => Generar un NUEVO TOKEN para el usuario, firmado con la clave 'SEED'        
                let token = jwt.sign({ usuario: usuarioBD }, SEED, { expiresIn: 14400 }); // 4 horas

                //         => Envia la RESPUESTA
                return res.status(200).json({ // status 200
                    ok: true,
                    usuario: usuarioBD,
                    token: token,
                    id: usuarioBD._id // envío como parte de la respuesta el _id del usuario
                });

            });
        }
    });

    // return res.status(200).json({
    //     ok: true,
    //     mensaje: 'OK!!',
    //     googleUser: googleUser
    // });

});

// ============================================================
//          *** AUTENTICACIÓN POR EMAIL Y PASSWORD ***
//   POST - Envío del email y password para login de usuario
// ============================================================

app.post('/', (req, res) => {

    // 1. Obtenemos el email y password del body de la petición
    var body = req.body;

    // 2. Comprueba si existe un usuario en la BD cuyo EMAIL coincide con el EMAIL recibido en el body
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

        // 2.3 Usuario con EMAIL CORRECTO => se procede a verificar la PASSWORD.
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