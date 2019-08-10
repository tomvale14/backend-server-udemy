// Requires
var express = require('express');
// obtengo una referencia a la LIBRERIA de mongoose
var mongoose = require('mongoose');
// referencia al middleware body-parser
var bodyParser = require('body-parser');

// Inicializar variables
var app = express();


// Body Parser
// NOTA: cuando entre una petición, este middleware siempre se va a ejecutar.
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
    // parse application/json
app.use(bodyParser.json())


// Importar los archivos de Rutas
var appRoutes = require('./routes/app');
var usuarioRoutes = require('./routes/usuario');
var loginRoutes = require('./routes/login');

// para establecer la CONEXION de mongoose a la BASE de DATOS
mongoose.connection.openUri('mongodb://localhost:27017/hospitalDB', (err, res) => {

    // si ocurre un error con la Base de Datos, lanza el error    
    if (err) throw err;

    // en caso contrario, o sea, no se produce ningún error
    console.log('Base de Datos: \x1b[32m%s\x1b[0m', 'online');

});

/* RUTAS */

// Cuando coincida con el path indicado en el primer parámetro, 
// lo maneja la variable correspondiente en el segundo parámetro.
// app.use('path_del_url', 'js_manejador_peticion');

app.use('/', appRoutes); // path principal
app.use('/login', loginRoutes); // path de Login
app.use('/usuario', usuarioRoutes); // path de Usuario

// Escuchar Peticiones
app.listen(3000, () => {
    console.log('Express Server puerto 3000: \x1b[32m%s\x1b[0m', 'online');
})