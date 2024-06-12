//call all the modules
const express = require("express");
const { connect } = require("http2");
const mysql = require("mysql");
const path = require("path");
const session = require("express-session");

//iniciar las rutas
const router = express.Router();

const connection = mysql.createConnection({
  host: "process.env.HOST",
  port: "3309",
  user: "rafaelcoelho",
  //password: "123456",
  database: "renting_cars",
});

let tipos = [];

const selectTipos = "SELECT DISTINCT(tipo) FROM modelos GROUP BY tipo";
connection.query(selectTipos, (error, results) => {
  try {
    tipos = results;
  } catch (error) {
    console.log(error);
  }
});
router.get("/", (req, res) => {
  const h2 = req.session.userName;
  const selectAll = `SELECT * FROM modelos`;
  connection.query(selectAll, (error, results) => {
    if (error) {
      console.log("este", error);
      res.status(503).render("error_servidor");
    } else {
      res.render("index", { h2: h2, results, tipos });
    }
  });
});
router.get(`/type/:tipo`, (req, res) => {
  const tipo = req.params.tipo;
  const findModelo = `SELECT * FROM modelos WHERE tipo = '${tipo}'`;
  connection.query(findModelo, (error, results) => {
    if (error) {
      console.log(error);
    } else {
      if (results.length === 0) {
        res.render("error", { h2: "Our wonderful Cars", tipos });
      }
      const titulo = tipo[0].toLocaleUpperCase() + tipo.slice(1) + "s";
      //console.log(titulo)
      res.render("index", { h2: titulo, results, tipos });
      //console.log(results)
    }
  });
});
router.get("/admin", (req, res) => {
  const selectAllAdmin = req.params;
  const displayAll = "SELECT * FROM modelos";
  connection.query(displayAll, (error, results) => {
    if (error) {
      console.log("getAdmin:", error);
    }
    res.render("admin", { results, tipos });
  });
});

router.post("/insert", (req, res) => {
  const {
    nombre,
    puertas,
    personas,
    maletas,
    cambio,
    tipo,
    precio,
    unidades_totales,
    unidades_alquiladas,
  } = req.body;
  const insertNew = `INSERT INTO modelos(nombre_modelo, puertas, personas, maletas, cambio, tipo, precioDia, unidades_totales, unidades_alquiladas)
    VALUES('${nombre}', '${puertas}', '${personas}', '${maletas}', '${cambio}', '${tipo}', '${precio}', '${unidades_totales}', '${unidades_alquiladas}')`;
  connection.query(insertNew, (error, results) => {
    if (error) {
      console.log("postAdmin: ", error);
    } else {
      res.redirect("/admin", { results, tipos });
    }
  });
});

router.get("/login", (req, res) => {
  //console.log(username())
  res.render("login", { tipos });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Use parameterized query to prevent SQL injection
  const userLogin = "SELECT * FROM clientes WHERE email = ?";
  connection.query(userLogin, [email], (error, results) => {
    if (error) {
      console.error("Error executing MySQL query: " + error);
      res.status(500).send("An error occurred while processing your request.");
      return;
    }

    if (results.length === 0) {
      // User with the provided email does not exist
      console.log("User does not exist");
      res.status(401).send("Invalid email or password.");
      return;
    }

    const user = results[0]; // Assuming there's only one user with a given email
    if (user.password === password) {
      // Password matches, user authenticated
      req.session.email = email;
      req.session.userId = user.id_cliente;
      req.session.userName = user.nombre;

      console.log("if", req.session.userId)

      res.redirect("/");
    } else {
      // Password does not match
      console.log("Invalid password");
      res.status(401).send("Invalid email or password.");
    }
  });
});

router.get("/alquillar", (req, res) => {
  const id_modelo = req.query.id_modelo; // Get the id_modelo from the query parameters
  console.log("id_cliente:", req.session.userId);
  const query = "SELECT * FROM modelos WHERE id_modelo = ?";
  connection.query(query, [id_modelo], (error, results) => {
    if (error) {
      console.error("Database error: ", error);
      return res
        .status(500)
        .send("An error occurred while fetching the model details.");
    }

    if (results.length === 0) {
      return res.status(404).send("Model not found");
    }

    const model = results[0];
    res.render("alquillar", { model, tipos }); // Assuming you are rendering a template named "alquillar" and passing the model data to it
  });
});

router.post("/reservar", (req, res) => {
  const id_cliente = req.session.userId;
  console.log("id_cliente/reservar:", req.session.userId);
  const id_modelo = req.query.id_modelo;

  const inicio = new Date(req.body.inicio);
  const termino = new Date(req.body.termino);
  // Convert the dates to YYYY-MM-DD format
  const formattedInicio = formatDate(inicio);
  const formattedTermino = formatDate(termino);
  //console.log("date :", formattedInicio, formattedTermino)

  // Function to format date to YYYY-MM-DD
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Adding leading zero if needed
    const day = String(date.getDate()).padStart(2, "0"); // Adding leading zero if needed
    return `${year}-${month}-${day}`;
  }
  function generateFacturacion() {
    return Math.floor(1000 + Math.random() * 9000);
  }
  const facturacion = generateFacturacion();
  console.log("facturacion:", facturacion);
  // Calculate the difference in milliseconds
  const differenceInMs = termino.getTime() - inicio.getTime();
  // Convert milliseconds to days
  const differenceInDays = Math.ceil(differenceInMs / (1000 * 60 * 60 * 24));
  //console.log("date: ", differenceInDays)
  // Log the result
  console.log("Number of days between the dates:", differenceInDays);

  // Assuming you have a database connection named 'connection'
  const insertReservationQuery = `INSERT INTO alquileres (id_modelo, id_cliente, fecha_recogida, fecha_entrega, facturacion) 
                                  VALUES (?, ?, ?, ?, ?)`;

  // Execute the query
  connection.query(
    insertReservationQuery,
    [id_modelo, id_cliente, formattedInicio, formattedTermino, facturacion],
    (error, results) => {
      if (error) {
        console.error("Error inserting reservation:", error);
        return res.status(500).send("Error inserting reservation");
      }
      console.log("Reservation inserted:", results);
      res.send(
        `Reservation inserted. Number of days between the dates: ${differenceInDays}`
      );
    }
  );
});

router.get("/register", (req, res) => {
  res.render("register", { tipos });
});

router.post("/register", (req, res) => {
  const { nombre, apellido, dni, tel, email, poblacio, password } = req.body;
  try {
    const insertNewUser = `INSERT INTO clientes(nombre, apellido, dni, tel, email, poblacio, password) 
  VALUES('${nombre}', '${apellido}', '${dni}', '${tel}', '${email}', '${poblacio}', '${password}')`;
    connection.query(insertNewUser, (error, results) => {
      if (error) {
        console.error("Error inserting new user:", error);
        return res.status(500).send("Error registering new user");
      }
      //console.log('User registered:', results);
      req.session.message = "User registered successfully";
      res.redirect("/login");
    });
  } catch (err) {
    console.error("Error hashing password:", err);
    res.status(500).send("Error registering new user");
  }
});

module.exports = { router, tipos };
