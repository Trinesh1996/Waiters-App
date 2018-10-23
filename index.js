// Dependencies and Modules
const express = require("express"),
    bodyParser = require("body-parser"),
    session = require("express-session"),
    flash = require("express-flash"),
    exphbs = require('express-handlebars'),
    pg = require("pg"),
    Pool = pg.Pool,
    waitersPool = require("./public/waiters");

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



app.get('/', async function (req, res) {
  res.render('welcome')
})

app.get("/waiters", async function (req, res) {
  let showDay = await waiters.showDays(); 
  let showWaiter = await waiters.getWaiter()
  
  res.render('home', {showDay, showWaiter})
})

app.post("/waiters", async function (req, res) {
  let user = req.body.name

  user = user.charAt(0).toUpperCase() + user.slice(1).toLowerCase();

  let char = /^[A-Za-z]+$/;

  if (user == undefined) {
    return false
  }
  
  let showDay = await waiters.showDays();
  let showWaiter = await waiters.getWaiter()
  let addWaiter =  await waiters.addWaiter(user);
 
  if (addWaiter == false || addWaiter == "") {
    req.flash('error', 'You forgot to enter your name');
  }
  
  res.redirect('/waiters/' + user)

});


app.post('/waiters/:username', async function (req, res, next) {
  try { 
    let user = req.params.username 
    let days = req.body.weekdays;
    let submitted = `Thanks for Submitting`
    let notSubmitted = `Please Select Your Shift`
    let showDay = await waiters.showDays(); 
    let showWaiter = await waiters.getWaiter()

  
    let waiter = `${user}`;
    console.log(days)

    if (days == undefined || days == "") {
      res.render('home', {notSubmitted, waiter, showWaiter})
    }
 
    

    else if (days != undefined || days != "" && user != undefined || user != "") {
      await waiters.addWaiter(user);
      let assign = await waiters.assignShifts(days, user);
     
      res.render('home', {submitted, waiter, showWaiter})
      console.log(assign)
    }
  }
    
  catch (err) {
    console.log("error" + "" + err)
    next(err)  
  }  
})

app.get('/waiters/:username', async function (req, res) {
 let user = req.params.username;
 let match = await waiters.matchCheckDays(user);
 var showDay = await waiters.showDays();
 let showWaiter = await waiters.getWaiter()


 let message = `Hello ${user}, Please Select Your Shift.`;

  res.render('selectShift', {showDay,match,user,showWaiter,message});

});

app.get('/days', async function (req, res) {
  let data = await waiters.displayShifts()
  let showWaiter = await waiters.getWaiter()

  res.render("waiter_shifts", {data, showWaiter});

})

app.get('/reset', async function(req,res) {
  await waiters.reset();

  res.redirect('/');
})


app.listen(PORT, function () {
    console.log('App starting on port', PORT)
  });