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
//         mensaje: 'Peticion realizada correctament - Medicos'
//     });

// });

// // exportamos las funciones definidas para poderlas utilizar fuera,
// // en este caso es la ruta definida por el app
// module.exports = app;


/****************************************************************
 * CUARTO: SERVICIOS CRUD DE MEDICOS
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

// arranco el modelo (esquema) de 'medico' definido en models/medico.js
var Medico = require('../models/medico');

// ===========================================
//   GET - Obtener todos los 'medicos'
// ===========================================
// Ruta Principal del app.js
app.get('/', (req, res) => {

    // 1. buscamos los 'medicos' del modelo por medio de la función find() de mongoose
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

    Medico.find({}
            //, 'nombre img usuario hospital'
        )
        .skip(desde)
        .limit(5)
        // info adicional de la colección 'usuario' que dió de alta el 'medico'
        //  => ES EL NOMBRE QUE REPRESENTA AL ID DE LA COLECCIÓN RELACIONADA CON 'hospital'
        .populate('usuario', 'nombre email')
        // info adicional de la colección 'hospital' al que pertenece el 'medico'
        //  => ES EL NOMBRE QUE REPRESENTA AL ID DE LA COLECCIÓN RELACIONADA CON 'hospital'
        .populate('hospital')
        .exec(
            (err, medicosObtenidos) => {

                // 1.1 si ocurre algún error al buscar registros
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error cargando medicos',
                        errors: err
                    });
                }

                // 1.2 si no sucede ningún error al buscar registros => contamos el nº total de registros
                Medico.count({}, (err, conteo) => { // NÚMERO TOTAL DE REGISTROS

                    // 1.2.1 si ocurre algún error al contar el número de registros
                    if (err) {
                        return res.status(500).json({ // status 500
                            ok: false,
                            mensaje: 'Error contando los registros de medico',
                            errors: err
                        });
                    }

                    // 1.2.2 si NO ocurre ningún error al contar el número de registros
                    res.status(200).json({ // status 200 OK
                        ok: true,
                        medicos: medicosObtenidos, // devuelve la colección de 'medicos'
                        totalRegistros: conteo // => devuelve EL TOTAL DE REGISTROS
                    });
                });
            });
});

// ===========================================
//    PUT - Actualizar un 'medico' existente
// ===========================================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {

    // 1. Por medio de la request, obtenemos el id del medico que queremos actualizar
    // (que se pasa por la URL) y lo guardamos en una variable
    var id = req.params.id;

    // 2. Por medio de la request, extrae el BODY de la petición
    //    solo funciona si tenemos definido el body-parser
    var body = req.body;

    // 3. A través del id del 'medico', comprueba si existe.
    //    si se produce un error en la BD => devuelve err - status 500
    //    si NO existe  => devuelve null                  - status 400
    //    si existe     => guarda el 'medico' con los nuevos datos y devuelve el objeto encontrado 
    Medico.findById(id, (err, medico) => {

        // 3.1 si no se encuentra el 'medico' => error 500
        if (err) { // ERROR de Base de Datos
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar medico',
                errors: err
            });
        }

        // 3.2 si NO existe => el 'medico' es null
        if (!medico) {
            return res.status(400).json({
                ok: false,
                //mensaje: 'El medico con el id ' + id + ' no existe',
                mensaje: `El medico con el id ${id} no existe`,
                errors: { message: 'No existe un medico con ese id' }
            });
        }

        // 3.3 si el 'medico' existe => extraemos el BODY para asignarlo al objeto usuario.
        //
        // Nota: la variable del body 'hospital' la tengo que mandar en el BODY,
        //       enviado desde la petición POST / PUT que realizaremos desde el frontend de Angular.
        //       Esta variable 'hospital' enviada en el body
        //          => solamente va a contener el 'id del hospital' que seleccionamos desde el frontend.

        medico.nombre = body.nombre;
        medico.usuario = req.usuario._id // => el _id del 'usuario' que hizo la petición
        medico.hospital = body.hospital // => el 'id del hospital' enviado en el body

        // 3.4 guardo el objeto 'medico' modificado
        medico.save((err, medicoActualizado) => {

            // 3.4.1 si ocurre algún error al guardar el 'medico' modificado
            if (err) {
                return res.status(400).json({ // status 400
                    ok: false,
                    mensaje: 'Error al actualizar medico',
                    errors: err
                });
            }

            // 3.4.2 si no se produce ningún error => devuelve el 'medico' guardado
            res.status(200).json({ // status 200
                ok: true,
                medico: medicoActualizado // devuelve el 'medico' que estamos actualizando:
                    //     => nombre_propiedad: nombre que devuelve en la función save
            });

        });

    });

});

// ===========================================
//    POST - Crear un nuevo 'medico'
// ===========================================

// 1. utiliza la FUNCION DE VERIFICACION 'verificaToken' de la libreria definida por la variable 'mdAutenticacion'
app.post('/', mdAutenticacion.verificaToken, (req, res) => {

    // 2. extrae el BODY de la petición
    var body = req.body;

    // 3. creamos un NUEVO OBJETO medico: Medico (del modelo de mongoose),
    //    asignando los valores del body recibido a los campos del objeto.
    //
    // Nota: la variable del body 'hospital' la tengo que mandar en el BODY,
    //       enviado desde la petición POST / PUT que realizaremos desde el frontend de Angular.
    //       Esta variable 'hospital' enviada en el body
    //          => solamente va a contener el 'id del hospital' que seleccionamos desde el frontend.

    var medico = new Medico({
        nombre: body.nombre,
        usuario: req.usuario._id, // => es el _id del 'usuario' que hizo la petición
        hospital: body.hospital // => es el 'id del hospital' que viene del body
    });

    // 4. guarda el nuevo 'medico'
    medico.save((err, medicoGuardado) => {

        // 4.1 si ocurre algún error
        if (err) { // ERROR de Base de Datos
            return res.status(400).json({ // status 400: Bad Request: el servidor no entiende la URL proporcionada
                ok: false,
                mensaje: 'Error al crear el medico',
                errors: err
            });
        }

        // 4.2 si NO se produce ningún error => devuelve el 'medico' guardado
        return res.status(201).json({
            ok: true,
            medico: medicoGuardado // devuelve el 'medico' que estamos creando
        });

    });

});

// ===========================================
//   DELETE - Borrar un 'medico' por el id
// ===========================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    // 1. Por medio de la request, obtenemos el id que se pasa por la URL y lo guardamos en una variable
    var id = req.params.id;

    // 2. A través del id del 'medico', comprueba si existe.
    //    si se produce un error en la BD => devuelve err - status 500
    //    si NO existe  => devuelve null                  - status 400
    //    si existe     => borra el objeto encontrado 
    Medico.findByIdAndRemove(id, (err, medicoBorrado) => {

        // 2.1 si ocurre algún error
        if (err) { // ERROR de Base de Datos
            return res.status(500).json({ // status 500
                ok: false,
                mensaje: 'Error al borrar medico',
                errors: err
            });
        }

        // 2.2 si no viene ningún 'medico' (array vacío)
        if (!medicoBorrado) {
            return res.status(400).json({ // status 400
                ok: false,
                mensaje: `El medico con el id ${id} no existe`,
                errors: { message: 'No existe un medico con ese id' }
            });
        }

        // 2.3 si no se produce ningún error => devuelve el 'medico' borrado
        res.status(200).json({ // status 200
            ok: true,
            medico: medicoBorrado // nombre_propiedad: nombre_base_de_datos
        });

    });

});

// exporto las funciones definidas en este archivo para poderlas utilizar fuera,
// en este caso es la ruta definida por el app
module.exports = app;