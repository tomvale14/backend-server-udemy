// importar la librería para la generación de un token
var jwt = require('jsonwebtoken');

// definimos la variable exportada del módulo que se encuentra en 'config.js'
var SEED = require('../config/config').SEED;

// ===========================================
//    MIDDLEWARE: Verificación del Token
// ===========================================

// Definición de la función y exportación de la misma
exports.verificaToken = function(req, res, next) {

    // 1. leemos el token a través de la petición URL
    var token = req.query.token;

    // 2. verificamos el token a través de jsonwebtoken (jwt)
    jwt.verify(token, SEED, (err, decoded) => { // decoded es el payload

        // 2.1 si ocurre algún error verificando el token
        if (err) {
            return res.status(401).json({ // status 401 - Unauthorized
                ok: false,
                mensaje: 'Token incorrecto',
                errors: err
            });
        }

        /**
         * 2.2 colocar en la request el usuario que se encuentra en el payload (objeto decoded)
         *     para que en cualquier lugar donde se utilice la función verificaToken esté disponible
         *     la información del usuario en el request.
         */
        req.usuario = decoded.usuario;


        // 2.3 si no hay errores en la verificación del token => indicamos que puede continuar con
        //     los siguientes servicios que se encuentren a continuación
        next();

        // res.status(200).json({
        //     ok: true,
        //     decoded: decoded
        // });

    });

}