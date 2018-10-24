// Dependencies and Modules
const express = require("express"),
    bodyParser = require("body-parser"),
    session = require("express-session"),
    flash = require("express-flash"),
    exphbs = require('express-handlebars'),
    pg = require("pg"),
    Pool = pg.Pool,
    waitersPool = require("./public/waiters");
    waitersRoutes = require("./routes/routes")

// init modules, env , port
let app = express(),
    PORT = process.env.PORT || 3015;


// SSL connection
let useSSL = false;
let local = process.env.LOCAL || false;
if (process.env.DATABASE_URL && !local) {
  useSSL = true
}

// connect to db
const connectionString = process.env.DATABASE_URL || 'postgresql://trinesh:Trinesh1997@@localhost:5432/WaitersApp';
const pool = new Pool({
  connectionString,
  ssl: useSSL
})
// pool init
const waiters = waitersPool(pool);
const services = waitersRoutes(waiters);

// middle ware use
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set("view engine", "handlebars");
app.engine('handlebars', exphbs({ defaultLayout: 'main' }))

app.use(session({
  secret: 'this is a string used for session in http',
  resave: false,
  saveUninitialized: true
}))

app.use(flash());

app.get('/', services.welcomePage);
app.get("/waiters", services.waitersModalHome);
app.post("/waiters", services.forWaitersEnterName);
app.post('/waiters/:username', services.selectedDays);
app.get('/waiters/:username',services.displayMatchedDays);
app.get('/days', services.displayShifts);
app.get('/reset', services.reset);


app.listen(PORT, function () {
    console.log('App starting on port', PORT)
  });