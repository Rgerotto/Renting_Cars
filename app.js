//call all the modules 
const express = require('express');
const {router, tipos} = require('./router.js');
const session = require('express-session')
//const bodyParser = require('body-parser');

//crear la aplicacion
const app = express();

//definir el puerto de conexion
const PORT = process.env.PORT || 3000;

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    //cookie: { secure: false } // Set to true if using HTTPS
  }));


//definir el motor de platilla
app.set('view engine', 'ejs');
//configurar body-parser
//app.use(bodyParser.urlencoded({extended: true}));
//app.use(bodyParser.json());
app.use(express.urlencoded({extended: true}));
app.use(express.json());

//definir la carpeta de los ficheros estaticos
app.use(express.static('public'));

//utilizar la rutas del fichero router.js
app.use(router);


//pener el servidor en marcha
app.listen(PORT, () => {
    console.log(`server working at http://localhost:${PORT}`)
})
