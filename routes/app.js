var express = require('express');

// levanto la app
var app = express();

// Ruta Principal del app.js
app.get('/', (req, res, next) => {

    res.status(200).json({
        ok: true,
        mensaje: 'Peticion realizada correctamente'
    });

});

// exportamos las funciones definidas para poderlas utilizar fuera,
// en este caso es la ruta definida por el app
module.exports = app;