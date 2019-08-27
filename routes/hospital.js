/**************************************************************************************
 * PRIMERO: Crear el fichero.js de Rutas.
 * 
 * => para poder probar si llega la nueva ruta,
 * => copiamos el contenido del fichero routes/app.js
 * => y lo pegamos en el nuevo fichero.js de Rutas.
 * 
 * => Nota 1: al final del fichero exportar las funciones definidas
 *          en este archivo para poderlas utilizar fuera.
 *          en este caso es la ruta definida por la variable app
 *          module.exports = app;
 * => Nota 2: todas las peticiones necesitan el envío del token
 *            excepto la petición GET.
 *            La autenticación se encuentra en el archivo middlewares/autenticacion.js
 **************************************************************************************/

// var express = require('express');

// // levanto la app
// var app = express();

// // Ruta Principal del app.js
// app.get('/', (req, res, next) => {

//     res.status(200).json({
//         ok: true,
//         mensaje: 'Peticion realizada correctamente - Hospitales'
//     });

// });

// exportamos las funciones definidas para poderlas utilizar fuera,
// en este caso es la ruta definida por el app
// module.exports = app;

/****************************************************************
 * CUARTO: SERVICIOS CRUD DE HOSPITALES
 * 
 * => Nota 1: todas las peticiones excepto el GET llevan token de
 *            autenticación de usuario.
 * => Nota 2: vamos implementando las peticiones de los servicios
 *            en el siguiente orden: GET - POST - PUT - DELETE
 * => Nota 3: probar las peticiones en Postman.
 ****************************************************************/

var express = require('express');

// levanto la app
var app = express();

// importar la librería para la encriptación de la password
var bcrypt = require('bcryptjs');

// importar la libreria que contiene la función de autenticación
var mdAutenticacion = require('../middlewares/autenticacion');

// importamos el modelo (esquema) de 'hospital' definido en models/hospital.js
var Hospital = require('../models/hospital');

// ===========================================
//   GET - Obtener todos los 'hospitales'
// ===========================================
// Ruta Principal del app.js
app.get('/', (req, res) => {

    // 1. buscamos los 'hospitales' del modelo por medio de la función find() de mongoose
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

    Hospital.find({}
            //, 'nombre img usuario'
        )
        .skip(desde)
        .limit(5)
        // info adicional de la colección 'usuario' que dió de alta el 'hospital'
        //  => ES EL NOMBRE QUE REPRESENTA AL ID DE LA COLECCIÓN RELACIONADA CON 'hospital'
        //  => el '_id' del objeto siempre se recupera
        .populate('usuario', 'nombre email')
        .exec(
            (err, hospitalesObtenidos) => {

                // 1.1 si ocurre algún error al buscar registros
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error cargando hospitales',
                        errors: err
                    });
                }

                // 1.2 si no sucede ningún error al buscar registros => contamos el nº total de registros
                Hospital.count({}, (err, conteo) => { // NÚMERO TOTAL DE REGISTROS

                    // 1.2.1 si ocurre algún error al contar el número de registros
                    if (err) {
                        return res.status(500).json({ // status 500
                            ok: false,
                            mensaje: 'Error contando los registros de hospital',
                            errors: err
                        });
                    }

                    // 1.2.2 si NO ocurre ningún error al contar el número de registros
                    res.status(200).json({ // status 200 OK
                        ok: true,
                        hospitales: hospitalesObtenidos, // devuelve la colección de 'hospitales'
                        totalRegistros: conteo // => devuelve EL TOTAL DE REGISTROS
                    });
                });
            });

});

// ===========================================
//    PUT - Actualizar un hospital existente
// ===========================================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {

    // 1. Por medio de la request, obtenemos el id del 'hospital' a modificar que se pasa por la URL y lo guardamos en una variable
    var id = req.params.id;

    // 2. Por medio de la request, extrae el BODY de la petición
    //    solo funciona si tenemos definido el body-parser
    var body = req.body;

    // 3. A través del id del 'hospital', comprueba si existe.
    //    si se produce un error en la BD => devuelve err - status 500
    //    si NO existe  => devuelve null                  - status 400
    //    si existe     => guarda el 'hospital' con los nuevos datos y devuelve el objeto encontrado 
    Hospital.findById(id, (err, hospital) => {

        // 3.1 si no se encuentra el 'hospital' => error 500
        if (err) { // ERROR de Base de Datos
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar hospital',
                errors: err
            });
        }

        // 3.2 si NO existe => el 'hospital' es null
        if (!hospital) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El hospital con el id ' + id + ' no existe',
                errors: { message: 'No existe un hospital con ese id' }
            });
        }

        // 3.3 si el 'hospital' existe => extraemos el BODY para asignarlo al objeto usuario
        hospital.nombre = body.nombre;
        hospital.usuario = req.usuario._id // => es el _id del usuario que hizo la petición

        // 3.4 guardo el objeto 'hospital' modificado
        hospital.save((err, hospitalActualizado) => {

            // 3.4.1 si ocurre algún error al guardar el 'hospital' modificado
            if (err) {
                return res.status(400).json({ // status 400
                    ok: false,
                    mensaje: 'Error al actualizar hospital',
                    errors: err
                });
            }

            // 3.4.2 si no se produce ningún error => devuelve el hospital guardado
            res.status(200).json({ // status 200
                ok: true,
                hospital: hospitalActualizado // devuelve el 'hospital' que estamos actualizando:
                    //     => nombre_propiedad: nombre que devuelve en la función save
            });

        });

    });

});

// ===========================================
//    POST - Crear un nuevo 'hospital'
// ===========================================

// 1. utiliza la FUNCION DE VERIFICACION 'verificaToken' de la libreria definida por la variable 'mdAutenticacion'
app.post('/', mdAutenticacion.verificaToken, (req, res) => {

    // 2. extrae el BODY de la petición
    var body = req.body;

    // 3. creamos un nuevo objeto de tipo 'Hospital' (del modelo de mongoose),
    //    asignando los valores del body recibido a los campos del objeto:

    var hospital = new Hospital({
        nombre: body.nombre,
        usuario: req.usuario._id // => es el _id del usuario que hizo la petición
    });

    // 4. guarda el nuevo 'hospital'
    hospital.save((err, hospitalGuardado) => {

        // 4.1 si ocurre algún error
        if (err) { // ERROR de Base de Datos
            return res.status(400).json({ // status 400: Bad Request: el servidor no entiende la URL proporcionada
                ok: false,
                mensaje: 'Error al crear el hospital',
                errors: err
            });
        }

        // 4.2 si NO se produce ningún error => devuelve el 'hospital' guardado
        return res.status(201).json({
            ok: true,
            hospital: hospitalGuardado // devuelve el 'hospital' que estamos creando
        });

    });

});

// ===========================================
//   DELETE - Borrar un 'hospital' por el id
// ===========================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    // 1. Por medio de la request, obtenemos el id que se pasa por la URL y lo guardamos en una variable
    var id = req.params.id;

    // 2. A través del id del 'hospital', comprueba si existe.
    //    si se produce un error en la BD => devuelve err - status 500
    //    si NO existe  => devuelve null                  - status 400
    //    si existe     => borra el objeto encontrado 
    Hospital.findByIdAndRemove(id, (err, hospitalBorrado) => {

        // 2.1 si ocurre algún error
        if (err) { // ERROR de Base de Datos
            return res.status(500).json({ // status 500
                ok: false,
                mensaje: 'Error al borrar hospital',
                errors: err
            });
        }

        // 2.2 si no viene ningún 'hospital' (array vacío)
        if (!hospitalBorrado) {
            return res.status(400).json({ // status 400
                ok: false,
                mensaje: 'El hospital con el id ' + id + ' no existe',
                errors: { message: 'No existe un hospital con ese id' }
            });
        }

        // 2.3 si no se produce ningún error => devuelve el 'hospital' borrado
        res.status(200).json({ // status 200
            ok: true,
            hospital: hospitalBorrado // nombre_propiedad: nombre_base_de_datos
        });

    });

});

// exporto las funciones definidas en este archivo para poderlas utilizar fuera,
// en este caso es la ruta definida por el app
module.exports = app;