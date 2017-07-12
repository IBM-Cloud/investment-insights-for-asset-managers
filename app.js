// app.js
// set up ======================================================================
// get all the tools we need
var express = require('express');
var app = express();
var cfenv = require('cfenv');
var passport = require('passport');
var flash = require('connect-flash');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var request = require('request');
var io = require('socket.io')();
var watson = require('watson-developer-cloud');

require('./config/passport')(passport);

//---Deployment Tracker---------------------------------------------------------
require("cf-deployment-tracker-client").track();

// configuration ===============================================================
// load local VCAP configuration
var vcapLocal = null
if (require('fs').existsSync('./vcap-local.json')) {
    try {
        vcapLocal = require("./vcap-local.json");
        console.log("Loaded local VCAP", vcapLocal);
    } catch (e) {
        console.error(e);
    }
}

// get the app environment from Cloud Foundry, defaulting to local VCAP
var appEnvOpts = vcapLocal ? {
    vcap: vcapLocal
} : {}
var appEnv = cfenv.getAppEnv(appEnvOpts);

var appName;
if (appEnv.isLocal) {
    require('dotenv').load();
}

// Cloudant
var Logs, Benefits;
var cloudantURL = appEnv.services.cloudantNoSQLDB[0].credentials.url || appEnv.getServiceCreds("fintrade-db").url;
var Cloudant = require('cloudant')({
  url: cloudantURL,
  plugin: 'retry',
  retryAttempts: 10,
  retryTimeout: 500
});

if (cloudantURL) {

    Logs = Cloudant.db.use('logs');
    Benefits = Cloudant.db.use('benefits');

} else {
    console.error("No Cloudant connection configured!");
}

app.use(express.static(__dirname + '/public'));

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'html');

// required for passport
app.use(session({
    secret: 'ana-insurance-bot',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

var bcrypt = require('bcrypt-nodejs');

// =====================================
// REGISTER/SIGNUP =====================
// =====================================
app.get('/', function(req, res) {
    req.session.lastPage = "/";

    res.render('index.html');
});

app.get('/login', function(req, res) {
    res.sendfile('./public/login.html');
});

app.get('/logout',
    function(req, res) {
        req.logout();
        res.redirect('/');
    });

app.get('/signup', function(req, res) {
    res.sendfile('./public/signup.html');
});

// process the login form
app.post('/login', function(req, res, next) {
    passport.authenticate('local-login', function(err, user, info) {
        if (err || info) {
            res.status(500).json({
                'message': info
            });
        } else {
            req.logIn(user, function(err) {
                if (err) {
                    res.status(500).json({
                        'message': 'Error logging in. Contact admin.'
                    });
                } else {
                    res.status(200).json({
                        'username': user.username,
                        'fname': user.fname,
                        'lname': user.lname
                    });
                }
            });
        }
    })(req, res, next);
});

app.post('/signup', function(req, res, next) {
    passport.authenticate('local-signup', function(err, user, info) {
        if (err || info) {
            res.status(500).json({
                'message': info
            });
        } else {
            console.log("Got user, now verify:",JSON.stringify(user));
            req.logIn(user, function(err) {
                if (err) {
                    console.log("Server error:",JSON.stringify(err));
                    res.status(500).json({
                        'message': "Error validating user. Try logging in."
                    });
                } else {
                    res.status(200).json({
                        'username': user.username,
                        'fname': user.fname,
                        'lname': user.lname
                    });
                }
            });
        }
    })(req, res, next);
});

app.get('/isLoggedIn', function(req, res) {
    var result = {
        outcome: 'failure'
    };

    if (req.isAuthenticated()) {
        result.outcome = 'success';
        result.username = req.user.username;
        result.fname = req.user.fname;
        result.lname = req.user.lname;
    }

    res.send(JSON.stringify(result, null, 3));
});

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) {
        return next();
    }

    // if they aren't redirect them to the home page
    res.redirect('/');
}

// =====================================
// PROFILE SECTION =====================
// =====================================
// we will want this protected so you have to be logged in to visit
// we will use route middleware to verify this (the isLoggedIn function)

app.get('/profile', isLoggedIn, function(req, res) {
    res.sendfile('./public/index.html');
});

app.get('/dashboard', function(req, res) {
    req.session.lastPage = "/dashboard";

    if (req.isAuthenticated()) {
        res.sendfile('./public/dashboard.html');
    } else {
        res.sendfile('./public/login.html');
    }
});

app.get('/soon', function(req, res) {
    res.sendfile('./public/soon.html');
});

app.get('/about', function(req, res) {
    res.redirect("https://github.com/IBM-Bluemix/finance-trade");
});

// launch ======================================================================
io.on('connection', function(socket) {
    console.log("Sockets connected.");
    // Whenever a new client connects send them the latest data
    socket.on('disconnect', function() {
        console.log("Socket disconnected.");
    });
});

io.listen(app.listen(appEnv.port, "0.0.0.0", function() {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
}));
