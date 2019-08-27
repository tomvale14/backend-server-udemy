// Requires
var express = require('express');
// obtengo una referencia a la LIBRERIA de mongoose
var mongoose = require('mongoose');
// referencia al middleware body-parser
var bodyParser = require('body-parser');

// Inicializar variables
var app = express();

// Body Parser
// NOTA: cuando entre una petición, este MIDDLEWARE siempre se va a ejecutar,
// siempre ANTES DE QUE SE RESUELVAN OTRAS RUTAS
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/**********************************************************************
 * SEGUNDO: Definir las variables que apuntan a los ficheros de Rutas
 *          y al mismo tiempo que se importan dichos ficheros.
 * => éstas variables van a manejar las peticiones CRUD
 **********************************************************************/

var appRoutes = require('./routes/app'); // principal
var loginRoutes = require('./routes/login');
var usuarioRoutes = require('./routes/usuario');
var hospitalRoutes = require('./routes/hospital');
var medicoRoutes = require('./routes/medico');
var busquedaRoutes = require('./routes/busqueda');
var uploadRoutes = require('./routes/upload');
var imagenesRoutes = require('./routes/imagenes');

// para establecer la CONEXION de mongoose a la BASE de DATOS
mongoose.connection.openUri('mongodb://localhost:27017/hospitalDB', (err, res) => {

    // si ocurre un error con la Base de Datos, lanza el error    
    if (err) throw err;

    // en caso contrario, o sea, no se produce ningún error
    console.log('Base de Datos: \x1b[32m%s\x1b[0m', 'online');

});

/***************************/
/*** Server Index Config ***/
/***************************/

// var serveIndex = require('serve-index');
// app.use(express.static(__dirname + '/'))
// app.use('/uploads', serveIndex(__dirname + '/uploads'));

/*************/
/*** RUTAS ***/
/*************/

// Cuando coincida con el path indicado en el primer parámetro, 
// lo maneja la variable correspondiente en el segundo parámetro.
// app.use('path_del_url', variable que apunta al .js encargado de manejar las peticiones);

app.use('/usuario', usuarioRoutes); // path de usuario
app.use('/hospital', hospitalRoutes); // path de hospital
app.use('/medico', medicoRoutes); // path de medico
app.use('/login', loginRoutes); // path de login
app.use('/busqueda', busquedaRoutes); // path de busqueda
app.use('/upload', uploadRoutes); // path de upload
app.use('/img', imagenesRoutes); // path de imagenes

// *** NOTA: esta va la última porque si no van a entrar todas las peticiones por aquí ***
app.use('/', appRoutes); // path principal

// Escuchar Peticiones
app.listen(3000, () => {
    console.log('Express Server puerto 3000: \x1b[32m%s\x1b[0m', 'online');
});