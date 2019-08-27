/**********************************************
 * SERVICIO FILE UPLOAD
 *********************************************/

var express = require('express');

// importar la librería para la carga de archivos
var fileUpload = require('express-fileupload');

// importar la librería para el manejo del sistema de archivos
var fs = require('fs');

// levanto la app del backend server => express
var app = express();

/** importamos los modelos (esquemas) de cada una de las colecciones **/
var Usuario = require('../models/usuario');
var Medico = require('../models/medico');
var Hospital = require('../models/hospital');

// implementar el Middleware: default options
//app.use( fileUpload() );
app.use(fileUpload({ useTempFiles: true }));

/**
 *  ==============================================
 *   PUT - Cargar archivo desde el servidor
 *  ==============================================
 *
 *  1.- Carga un archivo desde el servidor
 * 
 *      Parámetros de la URL:  - tipo: el tipo de COLECCIÓN a la que se quiere actualizar la imagen.
 *                             - id:   el id del usuario que creó el registro de la colección.
 */

app.put('/:tipo/:id', (req, res, next) => {

    // leemos los parámetros de la URL
    var varParamUrlTipo = req.params.tipo;
    var varParamUrlId = req.params.id;

    // => VALIDACIÓN del PARÁMETRO 'tipo' que son los TIPOS DE COLECCIÓN: 'usuarios' | 'medicos' | 'hospitales'
    var arrTiposValidos = ['usuarios', 'medicos', 'hospitales'];

    //  => SI NO SE ENCUENTRA 'varParamUrlTipo' dentro del array 'arrTiposValidos' => DEVUELVE EL VALOR -1
    //     Array.indexOf(elemento)     devuelve el índice de la primera ocurrencia 
    if (arrTiposValidos.indexOf(varParamUrlTipo) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: `El parámetro de la URL del tipo de colección '${ varParamUrlTipo }' no es válido.`,
            errors: { message: 'Los tipos de archivos válidos son: ' + arrTiposValidos.join(', ') }
        });
    }

    // 1.1 si no viene ningún archivo en la request
    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No seleccionó ningún archivo',
            errors: { message: 'Debe seleccionar un archivo de imagen' }
        });
    }

    // 1.2 obtenemos el NOMBRE del ARCHIVO a través de la request
    //  => 'imagen' es el nombre del parámetro del BODY de la REQUEST
    var nombreArchivo = req.files.imagen;

    // 1.3 obtenemos la EXTENSION del archivo a través del nombre del archivo
    //  => 'name' es el nombre del archivo ( incluída la extensión )
    //  => obtiene un array de strings separados por '.'
    var nombreCortado = nombreArchivo.name.split('.');

    // 1.4 lo que nos interesa es el ÚLTIMO ELEMENTO del ARRAY
    var extensionArchivo = nombreCortado[nombreCortado.length - 1];

    //  => la siguiente instrucción podría sustituir a las 2 anteriores ( 1.4 y 1.5 )
    //      var extensionArchivo = nombreArchivo.name.split('.').pop();

    // 1.5 VALIDACIÓN de las EXTENSIONES PERMITIDAS definiendo un array de tipo string
    var extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

    // 1.5.1 => si NO encuentra la extensión del archivo en el array
    if (extensionesValidas.indexOf(extensionArchivo) < 0) { // SI NO SE ENCUENTRA 'extensionArchivo' => DEVUELVE EL VALOR -1
        return res.status(400).json({
            ok: false,
            mensaje: `La extensión ${ extensionArchivo } no es válida`,
            errors: { message: 'Las extensiones válidas son: ' + extensionesValidas.join(', ') }
        });
    }

    // 1.6 definimos un NOMBRE DE ARCHIVO PERSONALIZADO => 'paramUrlId'-'numero'.png
    //  => el numero de los miliseguntos de la FECHA ACTUAL me asegura que no va a existir otro archivo con el mismo nombre.
    //      Va a prevenir que no va a coincidir con el caché de la imagen en el navegador Web.
    //      lo obtenemos con los milisegundos de la FECHA ACTUAL ( 3 dígitos )
    var nombreArchivoRenombrado = `${ varParamUrlId }-${ new Date().getMilliseconds() }.${ extensionArchivo }`;

    // 1.7 MOVEMOS el ARCHIVO del temporal al path
    //  => definimos una variable con el PATH completo del archivo, incluído el nombre y extensión
    //var path = `./uploads/${ varParamUrlTipo }/${ nombreArchivoRenombrado }`;

    //nombreArchivo.mv(path, err => {

    // 1.7.1 si se produce un error cuando intentamos mover el archivo
    // if (err) {
    //     return res.status(500).json({
    //         ok: false,
    //         mensaje: 'Error al mover el archivo',
    //         errors: { message: err }
    //     });
    // }

    // 1.7.2 si NO se produce ningún error cuando intentamos mover el archivo,
    //  => Llama a la función para SUBIR el ARCHIVO de la imagen de la colección correspondiente

    subirPorTipo(varParamUrlTipo, varParamUrlId, nombreArchivo, nombreArchivoRenombrado, res);

    //});

});

/**
 * Actualiza el nombre de la imagen en la BD y sube el archivo con la imagen en el Sistema de Ficheros.
 *      => Si volvemos a asignar otra imagen al registro de la coleccion de la BD:
 *              PRIMERO: tenemos que comprobar si existe una imagen previa.
 *              SEGUNDO: si existe => borramos la imagen antigua
 *                                 => guardamos la nueva
 * 
 * @param {*} varParamUrlTipo           parámetro de la URL del tipo de la colección del que se quiere actualizar la imagen.
 * @param {*} varParamUrlId             parámetro de la URL del id del usuario
 * @param {*} nombreArchivo             nombre del parámetro del BODY de la REQUEST
 * @param {*} nombreArchivoRenombrado   nombre del archivo renombrado que se va a guardar en el path de la colección
 * @param {*} res                       response
 */
function subirPorTipo(varParamUrlTipo, varParamUrlId, nombreArchivo, nombreArchivoRenombrado, res) {

    var path = '';

    // =======================
    //  Colección: 'usuarios'
    // =======================
    if (varParamUrlTipo === 'usuarios') {

        // Función de callback para comprobar si existe el _id del usuario
        //  => en caso afirmativo, devuelve toda la información de 'usuario' de la colección 'usuarios': esquema 'Usuario'
        Usuario.findById(varParamUrlId, (err, usuario) => {

            // 1. Si no existe el _id del registro 'usuario' en la colección 'usuarios' => se manda la respuesta correspondiente 
            if (!usuario) {
                return res.status(400).json({
                    ok: false,
                    mensaje: `El usuario con el ID '${ varParamUrlId }' no existe`,
                    errors: { message: 'No existe un usuario con ese ID' }
                });
            }

            // 2. Comprueba si el usuario ya cuenta con una imagen para poder eliminarla
            if (usuario.img) {

                // 2.1 Forma el contenido de la variable del path de la imagen que YA EXISTE EN LA BASE DE DATOS
                //    => 'usuario' es la variable del esquema importado que recibimos de la función callback.
                //    => 'img' es la propiedad 'img' del registro de la coleccion.
                //    =>  el path está compuesto por: ruta + nombre-archivo-imagen ( extensión incluída ).

                path = './uploads/usuarios/' + usuario.img;

                // 2.2 Se comprueba SI YA EXISTE un archivo de imagen ANTERIOR en el path
                if (fs.existsSync(path)) {
                    // => si existe ELIMINA EL ARCHIVO de la imagen anterior
                    fs.unlink(path, (error) => {
                        // => en el caso de que se produzca un error al borrar la imagen anterior
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                mensaje: 'Error al eliminar la imagen anterior',
                                errors: error
                            });
                        }
                    });
                }

            }

            // 3. Forma el contenido de la variable del path de la imagen a través de los NUEVOS PARÁMETROS
            path = `./uploads/${ varParamUrlTipo }/${ nombreArchivoRenombrado }`;

            // 4. MOVEMOS el ARCHIVO del directorio donde está la imagen que se recibe como parámetro del body, al path
            //  => 'nombreArchivo' es el nombre del parámetro del BODY de la REQUEST ( var nombreArchivo = req.files.imagen; )

            nombreArchivo.mv(path, error => {

                // 4.1 Si se produce un error cuando intentamos mover el archivo
                if (error) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al mover el archivo',
                        errors: { message: err }
                    });
                }
            });

            // 5. Actualiza el VALOR del CAMPO que contiene el NOMBRE de la IMAGEN en la BASE de DATOS ( propiedad 'img' del esquema 'Usuario' )
            //      *** NOTA IMPORTANTE ***:
            //      En la Base de Datos no se guarda la imagen, solamente se almacena el nombre de la imagen.
            //      La imagen se guarda en el Sistema de Archivos donde apunta la variable 'path'.
            usuario.img = nombreArchivoRenombrado;

            // 6. Actualiza el ARCHIVO con la NUEVA IMAGEN en el SISTEMA de ARCHIVOS
            usuario.save((err, usuarioActualizado) => { // en 'usuarioActualizado' recibimos toda la información del 'usuario'

                // ocultamos la password encriptada del 'usuario'
                usuarioActualizado.password = ':)';

                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de usuario actualizada correctamente',
                    usuario: usuarioActualizado
                });
            });
        });

    }

    // =======================
    //  Colección: 'medicos'
    // =======================
    if (varParamUrlTipo === 'medicos') {

        // Función de callback para comprobar si existe el _id del medico
        //  => en caso afirmativo, devuelve toda la información de 'medico' de la colección 'medicos': esquema 'Medico'
        Medico.findById(varParamUrlId, (err, medico) => {

            // 1. Si no existe el _id del registro 'medico' en la colección 'medicos' => se manda la respuesta correspondiente 
            if (!medico) {
                return res.status(400).json({
                    ok: false,
                    mensaje: `El medico con el ID '${ varParamUrlId }' no existe`,
                    errors: { message: 'No existe un medico con ese ID' }
                });
            }

            // 2. Comprueba si el 'medico' ya cuenta con una imagen para poder eliminarla
            if (medico.img) {

                // 2.1 Forma el contenido de la variable del path de la imagen que YA EXISTE EN LA BASE DE DATOS
                //    => 'medico' es la variable del esquema importado que recibimos de la función callback.
                //    => 'img' es la propiedad 'img' del registro de la coleccion.
                //    =>  el path está compuesto por: ruta + nombre-archivo-imagen ( extensión incluída ).

                path = './uploads/medicos/' + medico.img;

                // 2.2 Se comprueba SI YA EXISTE un archivo de imagen ANTERIOR en el path
                if (fs.existsSync(path)) {
                    // => si existe ELIMINA EL ARCHIVO de la imagen anterior
                    fs.unlink(path, (error) => {
                        // => en el caso de que se produzca un error al borrar la imagen anterior
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                mensaje: 'Error al eliminar la imagen anterior',
                                errors: error
                            });
                        }
                    });
                }

            }

            // 3. Forma el contenido de la variable del path de la imagen a través de los NUEVOS PARÁMETROS
            path = `./uploads/${ varParamUrlTipo }/${ nombreArchivoRenombrado }`;

            // 4. MOVEMOS el ARCHIVO del directorio donde está la imagen que se recibe como parámetro del body, al path
            //  => 'nombreArchivo' es el nombre del parámetro del BODY de la REQUEST ( var nombreArchivo = req.files.imagen; )

            nombreArchivo.mv(path, error => {

                // 4.1 Si se produce un error cuando intentamos mover el archivo
                if (error) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al mover el archivo',
                        errors: { message: err }
                    });
                }
            });

            // 5. Actualiza el VALOR del CAMPO que contiene el NOMBRE de la IMAGEN en la BASE de DATOS ( propiedad 'img' del esquema 'Medico' )
            //      *** NOTA IMPORTANTE ***:
            //      En la Base de Datos no se guarda la imagen, solamente se almacena el nombre de la imagen.
            //      La imagen se guarda en el Sistema de Archivos donde apunta la variable 'path'.
            medico.img = nombreArchivoRenombrado;

            // 6. Actualiza el ARCHIVO con la NUEVA IMAGEN en el SISTEMA de ARCHIVOS
            medico.save((err, medicoActualizado) => { // en 'medicoActualizado' recibimos toda la información del 'medico'

                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de medico actualizada correctamente',
                    medico: medicoActualizado
                });
            });
        });

    }

    // =========================
    //  Colección: 'hospitales'
    // =========================
    if (varParamUrlTipo === 'hospitales') {

        // Función de callback para comprobar si existe el _id del 'hospital'
        //  => en caso afirmativo, devuelve toda la información de 'hospital' de la colección 'hospital': esquema 'Hospital'
        Hospital.findById(varParamUrlId, (err, hospital) => {

            // 1. Si no existe el _id del registro 'hospital' en la colección 'hospital' => se manda la respuesta correspondiente 
            if (!hospital) {
                return res.status(400).json({
                    ok: false,
                    mensaje: `El hospital con el ID '${ varParamUrlId }' no existe`,
                    errors: { message: 'No existe un hospital con ese ID' }
                });
            }

            // 2. Comprueba si el 'hospital' ya cuenta con una imagen para poder eliminarla
            if (hospital.img) {

                // 2.1 Forma el contenido de la variable del path de la imagen que YA EXISTE EN LA BASE DE DATOS
                //    => 'hospital' es la variable del esquema importado que recibimos de la función callback.
                //    => 'img' es la propiedad 'img' del registro de la coleccion.
                //    =>  el path está compuesto por: ruta + nombre-archivo-imagen ( extensión incluída ).

                path = './uploads/hospitales/' + hospital.img;

                // 2.2 Se comprueba SI YA EXISTE un archivo de imagen ANTERIOR en el path
                if (fs.existsSync(path)) {
                    // => si existe ELIMINA EL ARCHIVO de la imagen anterior
                    fs.unlink(path, (error) => {
                        // => en el caso de que se produzca un error al borrar la imagen anterior
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                mensaje: 'Error al eliminar la imagen anterior',
                                errors: error
                            });
                        }
                    });
                }

            }

            // 3. Forma el contenido de la variable del path de la imagen a través de los NUEVOS PARÁMETROS
            path = `./uploads/${ varParamUrlTipo }/${ nombreArchivoRenombrado }`;

            // 4. MOVEMOS el ARCHIVO del directorio donde está la imagen que se recibe como parámetro del body, al path
            //  => 'nombreArchivo' es el nombre del parámetro del BODY de la REQUEST ( var nombreArchivo = req.files.imagen; )

            nombreArchivo.mv(path, error => {

                // 4.1 Si se produce un error cuando intentamos mover el archivo
                if (error) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al mover el archivo',
                        errors: { message: err }
                    });
                }
            });

            // 5. Actualiza el VALOR del CAMPO que contiene el NOMBRE de la IMAGEN en la BASE de DATOS ( propiedad 'img' del esquema 'Hospital' )
            //      *** NOTA IMPORTANTE ***:
            //      En la Base de Datos no se guarda la imagen, solamente se almacena el nombre de la imagen.
            //      La imagen se guarda en el Sistema de Archivos donde apunta la variable 'path'.
            hospital.img = nombreArchivoRenombrado;

            // 6. Actualiza el ARCHIVO con la NUEVA IMAGEN en el SISTEMA de ARCHIVOS
            hospital.save((err, hospitalActualizado) => { // en 'hospitalActualizado' recibimos toda la información del 'hospital'

                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de hospital actualizada correctamente',
                    hospital: hospitalActualizado
                });
            });
        });

    }

}


// exportamos las funciones definidas para poderlas utilizar fuera,
// en este caso es la ruta definida por el app
module.exports = app;