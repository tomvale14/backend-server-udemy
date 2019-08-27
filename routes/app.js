/**********************************************
 * CODIGO PARA PUEBAS DE NUEVAS RUTAS
 *  => Esqueleto Base para una petición REST
 *********************************************/

var express = require('express');

// levanto la app
var app = express();

// Ruta padre
app.get('/', (req, res, next) => {

    res.status(200).json({
        ok: true,
        mensaje: 'Peticion realizada correctamente'
    });

});

// exportamos las funciones definidas para poderlas utilizar fuera,
// en este caso es la ruta definida por el app
module.exports = app;