/*******************************/
/** SERVICIOS CRUD DE USUARIOS */
/*******************************/

var express = require('express');

// levanto la app
var app = express();

// importar la librería para la encriptación de la password
var bcrypt = require('bcryptjs');

// importar la libreria que contiene la función de autenticación
var mdAutenticacion = require('../middlewares/autenticacion');

// arranco el modelo (esquema) de Usuario definido en models/usuario.js
var Usuario = require('../models/usuario');

// ===========================================
//   GET - Obtener todos los usuarios
// ===========================================
// Ruta Principal del app.js
app.get('/', (req, res, next) => {

    // 1. buscamos los 'usuarios' del modelo por medio de la función find() de mongoose
    //    => Nota 1: podemos limitar los campos a recuperar (separados pos un espacio en blanco).
    //               -> si no ponemos el segundo parámetro => recupera todos los campos del modelo.
    //    => Nota 2: con la función populate podemos recuperar tambien en la función de búsqueda
    //               INFORMACION ADICIONAL: populate( colección adicional a recuperar, campos de la coleccion adicional ).
    //               -> si no se especifica el 2º parámetro, se recuperan todos los campos de la colección.
    //    => Nota 3: limit(n)   limita la recuperación a n registros insertados.
    //    => Nota 4: skip(n)    salta los n primeros registros recuperados.
    //
    //    => PAGINACIÓN DE REGISTROS: salta 'desde' registros y muestra los siguientes 'n' registros
    //    => NÚMERO TOTAL DE REGISTROS: Modelo.count({}, ( err, conteo )) => {}

    // variable numérica opcional que viene de la request
    // => si no existe el parámetro su valor es 0

    var desde = req.query.desde || 0;
    desde = Number(desde); // fuerza que sea un número

    Usuario.find({}, 'nombre email img role')
        .skip(desde)
        .limit(5)
        .exec(
            (err, usuarioObtenidos) => {

                // 1.1 si ocurre algún error al buscar registros
                if (err) { // ERROR GRAVE de Base de Datos
                    return res.status(500).json({ // status 500
                        ok: false,
                        mensaje: 'Error cargando usuarios',
                        errors: err
                    });
                }

                // 1.2 si no sucede ningún error al buscar registros => contamos el nº total de registros
                Usuario.count({}, (err, conteo) => { // NÚMERO TOTAL DE REGISTROS

                    // 1.2.1 si ocurre algún error al contar el número de registros
                    if (err) {
                        return res.status(500).json({ // status 500
                            ok: false,
                            mensaje: 'Error contando los registros de usuario',
                            errors: err
                        });
                    }

                    // 1.2.2 si NO ocurre ningún error al contar el número de registros
                    res.status(200).json({ // status 200 OK
                        ok: true,
                        usuarios: usuarioObtenidos, // => devuelve la colección de 'usuarios'
                        totalRegistros: conteo // => devuelve EL TOTAL DE REGISTROS
                    });
                });
            });

});

// ===========================================
//    PUT - Actualizar un usuario existente
// ===========================================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => { // el parámetro next del callback no lo vamos a usar

    // 1. Por medio de la request, obtenemos el id que se pasa por la URL
    // por ejemplo el parámetro id de la URL: '5d4d98d892a398335c04b835'
    var id = req.params.id;

    // 2. Por medio de la request, extrae el BODY de la petición
    //    solo funciona si tenemos definido el body-parser
    var body = req.body;

    // 3. A través del id del 'usuario', comprueba si existe.
    //    si se produce un error en la BD => devuelve err - status 500    
    //    si NO existe  => devuelve null                  - status 400  
    //    si existe     => devuelve el objeto encontrado
    Usuario.findById(id, (err, usuario) => {

        // 3.1 si no se encuentra el 'usuario' => error 500
        if (err) { // ERROR de Base de Datos
            return res.status(500).json({ // status 500
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        // 3.2 si NO existe => el 'hospital' es null        
        if (!usuario) {
            return res.status(400).json({ // status 400: Bad Request
                ok: false,
                mensaje: `El usuario con el id ${ id } no existe`, // template literal
                errors: { message: 'No existe un usuario con ese ID' }
            });
        }

        // 3.3 si el 'usuario' existe => extraemos el BODY para asignarlo al objeto usuario
        usuario.nombre = body.nombre;
        usuario.email = body.email;
        usuario.role = body.role;

        // 3.4 guardo el objeto 'usuario' modificado
        usuario.save((err, usuarioActualizado) => {

            // 3.4.1 si ocurre algún error al guardar el 'usuario' modificado
            if (err) { // ERROR de Base de Datos
                return res.status(400).json({ // status 400
                    ok: false,
                    mensaje: 'Error al actualizar usuario',
                    errors: err
                });
            }

            /**
             * 3.4.2 Forma alternativa de ocultar el password encriptado:
             * 
             * una vez que se ha almacenado el password encriptado en la Base de Datos
             * se oculta para que no aparezca en el objeto del response.
             */
            usuarioActualizado.password = ':)';

            // 3.4.3 si no se produce ningún error => devuelve el usuario guardado
            res.status(200).json({ // status 200
                ok: true,
                usuario: usuarioActualizado // devuelve el usuario que estamos actualizando:
                    //     => nombre_propiedad: nombre que devuelve en la función save
            });

        });

    });

});

// ===========================================
//    POST - Crear un nuevo usuario
// ===========================================

// 1. utiliza la FUNCION DE VERIFICACION 'verificaToken' de la libreria definida por la variable 'mdAutenticacion'
app.post('/', mdAutenticacion.verificaToken, (req, res, next) => { // el parámetro next del callback no lo vamos a usar

    // 2. extrae el BODY de la petición
    //    solo funciona si tenemos definido el body-parser
    var body = req.body;

    // 3. creamos un nuevo objeto de tipo Usuario (del modelo de mongoose),
    //    asignando los valores del body recibido a los campos del objeto:

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

        // 4.2 si NO se produce ningún error => devuelve el usuario guardado
        res.status(201).json({ // status 201 Recurso creado
            ok: true,
            usuario: usuarioGuardado, // devuelve el usuario que estamos creando
            //  => devuelve la información del usuario que realizó la solicitud y que ha sido guardado
            //     por la función de autenticación en la REQUEST
            usuariotoken: req.usuario
        });

    });

});

// ===========================================
//   DELETE - Borrar un 'usuario' por el id
// ===========================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    // 1. Por medio de la request, obtenemos el id que se pasa por la URL y lo guardamos en una variable    
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

        // 2.2 si no viene ningún 'usuario' (array vacío)
        if (!usuarioBorrado) {
            return res.status(400).json({ // status 400
                ok: false,
                mensaje: `El usuario con el id ${id} no existe`,
                errors: { message: 'No existe un usuario con ese ID' }
            });
        }

        // 2.3 si no se produce ningún error => devuelve el 'usuario' borrado
        res.status(200).json({ // status 200
            ok: true,
            usuario: usuarioBorrado // nombre_propiedad: nombre_base_de_datos
        });

    })

});

// exporto las funciones definidas en este archivo para poderlas utilizar fuera,
// en este caso es la ruta definida por el app
module.exports = app;