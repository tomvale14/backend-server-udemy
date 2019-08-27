/**********************************************
 *******   SERVICIO DE BUSQUEDAS   ************
 *********************************************/

var express = require('express');

// levanto la app
var app = express();

// importamos el modelo (esquema) de 'hospital' definido en models/hospital.js
var Hospital = require('../models/hospital');
// importamos el modelo (esquema) de 'medico' definido en models/medico.js
var Medico = require('../models/medico');
// importamos el modelo (esquema) de 'usuario' definido en models/usuario.js
var Usuario = require('../models/usuario');


// ===============================================
//    BÚSQUEDA ESPECÍFICA EN UNA SOLA COLECCION
// ===============================================

app.get('/coleccion/:tabla/:busqueda', (req, res) => {

    // extrae el parámetro 'busqueda' de la request
    var busqueda = req.params.busqueda;

    // creamos una Expresión Regular para la búsqueda
    //  => 'i': no diferencia entre mayúsculas y minúsculas
    var regExp = new RegExp(busqueda, 'i');

    // extrae el parámetro 'tabla' de la request
    var tabla = req.params.tabla;

    // variable para almacenar la promesa que quiero ejecutar
    var promesa;

    //compruebo que el parámetro 'tabla' es una tabla (coleccion) válida:
    //      => usuarios | hospitales | medicos
    switch (tabla) {
        case 'usuarios':
            promesa = buscarUsuarios(regExp);
            break;
        case 'medicos':
            promesa = buscarMedicos(regExp);
            break;
        case 'hospitales':
            promesa = buscarHospitales(regExp);
            break;
        default:
            res.status(400).json({ // Bad Request
                ok: false,
                mensaje: 'Los tipos de colecciones de búsqueda son: usuarios, medicos y hospitales',
                error: { message: `El tipo de tabla/colección ${tabla} no es válido` }
            });
    }

    promesa.then(data => {

        res.status(200).json({
            ok: true,
            [tabla]: data


        });
    });
});



// ===============================================
//    BÚSQUEDA GENERAL EN TODAS LAS COLECCIONES
// ===============================================

// Ruta padre
app.get('/todo/:busqueda', (req, res, next) => {

    // extrae el parámetro 'busqueda'
    var busqueda = req.params.busqueda;

    // creamos una Expresión Regular para la búsqueda
    //  => 'i': no diferencia entre mayúsculas y minúsculas
    var regExp = new RegExp(busqueda, 'i');

    /**
     * Llamada a un ARRAY de PROMESAS.
     *    => Si una de las Promesas falla, lo controlamos con catch
     */

    Promise.all([
            // llamada a la función buscarHospitales()
            //   => en vez de ejecutar la función find() directamente,
            //      espero la respuesta de la función buscarHospitales() que devuelve una promesa.    
            buscarHospitales(regExp),
            buscarMedicos(regExp),
            buscarUsuarios(regExp)

        ])
        .then(arrayRespuestas => {

            res.status(200).json({
                ok: true,
                hospitales: arrayRespuestas[0], // posición 0 de arrayRespuestas: devuelve la colección de 'hospitales' que cumple la colección de búsqueda
                medicos: arrayRespuestas[1], // posición 1 de arrayRespuestas: devuelve la colección de 'medicos' que cumple la colección de búsqueda
                usuarios: arrayRespuestas[2] // posición 2 de arrayRespuestas: devuelve la colección de 'usuarios' que cumple la colección de búsqueda de VARIOS CAMPOS

            });

        });

});

/**
 * Función que devuelve una PROMESA de búsqueda de 'hospitales'
 *  
 * @param regExp    expresión regular de la cadena de búsqueda que se recibe como parámetro en la URL
 */
function buscarHospitales(regExp) {

    return new Promise((resolve, reject) => {

        // utilizo el modelo 'Hospital' para realizar la búsqueda
        //    => Nota 1: el parámetro de la función find( campo a buscar: variable Expresion Regular )
        //    => Nota 2: en la búsqueda de 'hospitales' añadimos (populate) la info de 'usuario' que creó el 'hospital
        Hospital.find({ 'nombre': regExp })
            .populate('usuario', 'nombre email')
            .exec((err, hospitalesBusqueda) => {

                if (err) {
                    reject('Error al buscar hospitales', err)
                } else {
                    resolve(hospitalesBusqueda);
                }

            });
    });
}

/**
 * Función que devuelve una PROMESA de búsqueda de 'medicos'
 *  
 * @param regExp    expresión regular de la cadena de búsqueda que se recibe como parámetro en la URL
 */
function buscarMedicos(regExp) {

    return new Promise((resolve, reject) => {

        // utilizo el modelo 'Medico' para realizar la búsqueda
        //    => Nota 1: el parámetro de la función find( campo a buscar: variable Expresion Regular )
        Medico.find({ 'nombre': regExp })
            .populate('usuario', 'nombre email')
            .populate('hospital')
            .exec((err, medicosBusqueda) => {

                if (err) {
                    reject('Error al buscar medicos', err)
                } else {
                    resolve(medicosBusqueda);
                }
            });
    });
}

/**
 * Función que devuelve una PROMESA de búsqueda de 'usuarios'
 *  => BÚSQUEDA EN 2 COLUMNAS DE UNA MISMA COLECCIÓN ( ejemplo de búsqueda por nombre y email )
 *  
 * @param regExp    expresión regular de la cadena de búsqueda que se recibe como parámetro en la URL
 */
function buscarUsuarios(regExp) {

    return new Promise((resolve, reject) => {

        // utilizo el modelo 'Usuario' para realizar la búsqueda
        //    => Nota 1: el parámetro de la función find( campo a buscar: variable Expresion Regular )
        Usuario.find({}, 'nombre email role') // especifico los campos resultado de la búsqueda
            .or([{ 'nombre': regExp }, { 'email': regExp }])
            .exec((err, usuariosBusqueda) => {

                if (err) {
                    reject('Error al buscar usuarios', err);
                } else {
                    resolve(usuariosBusqueda);
                }


            });

    });
}

// exportamos las funciones definidas para poderlas utilizar fuera,
// en este caso es la ruta definida por el app
module.exports = app;