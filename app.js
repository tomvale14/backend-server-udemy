// Requires
var express = require('express');
// obtengo una referencia a la LIBRERIA de mongoose
var mongoose = require('mongoose');

// Inicializar variables
var app = express();

// para establecer la CONEXION de mongoose a la BASE de DATOS
mongoose.connection.openUri('mongodb://localhost:27017/hospitalDB', (err, res) => {

    // si ocurre un error con la Base de Datos, lanza el error    
    if (err) throw err;

    // en caso contrario, o sea, no se produce ningún error
    console.log('Base de Datos: \x1b[32m%s\x1b[0m', 'online');

});

// Rutas
app.get('/', (req, res, next) => {

    res.status(200).json({
        ok: true,
        mensaje: 'Peticion realizada correctamente'
    });

});


// Escuchar Peticiones
app.listen(3000, () => {
    console.log('Express Server puerto 3000: \x1b[32m%s\x1b[0m', 'online');
})