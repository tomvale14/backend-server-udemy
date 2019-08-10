var express = require('express');

// levanto la app
var app = express();

// importar la librería para la encriptación de la password
var bcrypt = require('bcryptjs');

// importar la librería para la generación de un token
var jwt = require('jsonwebtoken');

// importar la libreria que contiene la función de autenticación
var mdAutenticacion = require('../middlewares/autenticacion');

// arranco el modelo (esquema) de Usuario definido en models/usuario.js
var Usuario = require('../models/usuario');

// ===========================================
//   GET - Obtener todos los usuarios
// ===========================================
// Ruta Principal del app.js
app.get('/', (req, res, next) => {

    // 1. buscamos los usuarios del modelo por medio de la función find() de mongoose
    //    podemos limitar los campos a recuperar (separados pos un espacio en blanco)
    Usuario.find({}, 'nombre email img role')
        .exec(
            (err, usuarios) => {

                // 1.1 si ocurre algún error
                if (err) { // ERROR GRAVE de Base de Datos
                    return res.status(500).json({ // status 500
                        ok: false,
                        mensaje: 'Error cargando usuarios',
                        errors: err
                    });
                }

                // 1.2 si no sucede ningún error
                res.status(200).json({ // status 200 OK
                    ok: true,
                    usuarios: usuarios // devuelve la colección de usuarios
                });
            });
});

// ===========================================
//    PUT - Actualizar un nuevo usuario
// ===========================================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => { // el parámetro next del callback no lo vamos a usar

    // 1. obtenemos el id que se para por la URL
    var id = req.params.id;

    // 2. extrae el BODY de la petición
    //    solo funciona si tenemos definido el body-parser
    var body = req.body;

    // 3. Comprueba si existe el usuario a través del id del mismo
    Usuario.findById(id, (err, usuario) => { // usuario: es el usuario encrontrado o null si no existe

        // 3.1 si no se encuentra el usuario => error 500
        if (err) { // ERROR de Base de Datos
            return res.status(500).json({ // status 500
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        // 3.2 si el usuario es null
        if (!usuario) {
            return res.status(400).json({ // status 400: Bad Request
                ok: false,
                mensaje: 'El usuario con el id ' + id + ' no existe',
                errors: { message: 'No existe un usuario con ese ID' }
            });
        }

        // 3.3 el usuario existe => extraemos el BODY para asignarlo al objeto usuario
        usuario.nombre = body.nombre;
        usuario.email = body.email;
        usuario.role = body.role;

        // 3.4 guardo el usuario modificado
        usuario.save((err, usuarioGuardado) => {

            // 3.4.1. si ocurre algún error
            if (err) { // ERROR de Base de Datos
                return res.status(400).json({ // status 400
                    ok: false,
                    mensaje: 'Error al actualizar usuario',
                    errors: err
                });
            }

            // forma alternativa de ocultar el password encriptado despues de guardarlo en BD
            usuarioGuardado.password = ':)';

            // 3.4.2 si no se produce ningún error => devuelve el usuario guardado
            res.status(200).json({ // status 200
                ok: true,
                usuario: usuarioGuardado // devuelve el usuario que estamos actualizando:    nombre_propiedad: nombre_base_de_datos
            });

        });

    });

})

// ===========================================
//    POST - Crear un nuevo usuario
// ===========================================

// 1. utiliza la FUNCION DE VERIFICACION 'verificaToken' de la libreria definida por la variable 'mdAutenticacion'
app.post('/', mdAutenticacion.verificaToken, (req, res, next) => { // el parámetro next del callback no lo vamos a usar

    // 2. extrae el BODY de la petición
    //    solo funciona si tenemos definido el body-parser
    var body = req.body;

    // 3. creamos un nuevo objeto de tipo Usuario (del modelo de mongoose)
    var usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10), // contraseña encriptada
        img: body.img,
        role: body.role
    });

    // 4. guarda el nuevo usuario
    usuario.save((err, usuarioGuardado) => {

        // 4.1 si ocurre algún error
        if (err) { // ERROR de Base de Datos
            return res.status(400).json({ // status 400: Bad Request
                ok: false,
                mensaje: 'Error al crear el usuario',
                errors: err
            });
        }

        // 4.2 si no se produce ningún error => devuelve el usuario guardado
        res.status(201).json({ // status 201 Recurso creado
            ok: true,
            usuario: usuarioGuardado, // devuelve el usuario que estamos creando:    nombre_propiedad: nombre_base_de_datos
            usuariotoken: req.usuario // devuelve la información del usuario que realizó la solicitud
        });
    });

});

// ===========================================
//   DELETE - Borrar un usuario por el id
// ===========================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    // 1. obtenemos el id que se para por la URL
    var id = req.params.id;

    // 2. Comprueba si existe el usuario a través del id del mismo.
    //    En caso de que exista el usuario, la función borra el registro.
    Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {

        // 2.1 si ocurre algún error
        if (err) { // ERROR de Base de Datos
            return res.status(500).json({ // status 500
                ok: false,
                mensaje: 'Error al borrar usuario',
                errors: err
            });
        }

        // 2.2 si no viene ningún usuario (array vacío)
        if (!usuarioBorrado) {
            return res.status(400).json({ // status 400
                ok: false,
                mensaje: 'El usuario con el id ' + id + ' no existe',
                errors: { message: 'No existe un usuario con ese ID' }
            });
        }

        // 2.3 si no se produce ningún error => devuelve el usuario guardado
        res.status(200).json({ // status 200
            ok: true,
            usuario: usuarioBorrado // devuelve el usuario borrado:    nombre_propiedad: nombre_base_de_datos
        });

    })

});


// exporto las funciones definidas en este archivo para poderlas utilizar fuera,
// en este caso es la ruta definida por el app
module.exports = app;