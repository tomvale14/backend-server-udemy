/**********************************************
 * SERVICIO DE CARGA DE IMÁGENES
 *********************************************/

var express = require('express');

// levanto la app
var app = express();

// importar la librería para el manejo del path. Ya viene incluída en el Node.js
const path = require('path');

// importar la librería para el manejo del sistema de archivos
var fs = require('fs');

/**
 *  ==================================================
 *   PUT - Cargar archivo de imagen desde el servidor
 *  ==================================================
 *
 *  Carga un archivo de imagen ( desde el servidor ) de un usuario, hospital o médico.
 *  Si alguno de ellos no tiene asociada una imagen, se cargará una por defecto de assets/no-img.jpg
 * 
 *      Ejemplo URL: localhost:3000/img/medicos/5d56d09dc91d3f32e8cd3fad-479.jpg
 * 
 *  Parámetros de la URL:  
 *         - tipo: el tipo de COLECCIÓN que coincide con la carpeta dentro de uploads donde se encuentran las imágenes asociadas.
 *         - img:  el nombre de la imagen que se encuentra en el Sistema de Archicos
 */
app.get('/:tipo/:img', (req, res, next) => {

    // 1. leemos los parámetros de la URL
    var varParamUrlTipo = req.params.tipo; // usuarios | medicos | hospitales
    var varParamUrlImg = req.params.img; // nombre y extensión de la imagen

    // 2. Resolvemos el path completo donde se encuentra la imagen
    //  => __dirname: contiene la ruta de donde me encuentro en este momento
    var pathImagen = path.resolve(__dirname, `../uploads/${ varParamUrlTipo }/${ varParamUrlImg }`);

    // 3. VERIFICA SI EXISTE LA IMAGEN EN EL PATH
    // 3.1 Si existe la imagen en el path => transfiere el archivo de la imagen del path desde el servidor
    // 3.2 Si NO existe la imagen en el path   => construye el path por defecto
    //                                         => tranfiere la imagen por defecto: no-img.jpg
    if (fs.existsSync(pathImagen)) {
        res.sendFile(pathImagen);
    } else {
        var pathNoImagen = path.resolve(__dirname, '../assets/no-img.jpg');
        res.sendFile(pathNoImagen);
    }

});

// exportamos las funciones definidas para poderlas utilizar fuera,
// en este caso es la ruta definida por el app
module.exports = app;