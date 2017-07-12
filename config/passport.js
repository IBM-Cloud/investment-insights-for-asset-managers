var LocalStrategy = require('passport-local').Strategy;
var cfenv = require('cfenv');
var fs = require('fs');

// load local VCAP configuration
var vcapLocal = null;
var appEnv = null;
var appEnvOpts = {};

fs.stat('./vcap-local.json', function(err, stat) {
    if (err && err.code === 'ENOENT') {
        // file does not exist
        console.log('No vcap-local.json');
        initializeAppEnv();
    } else if (err) {
        console.log('Error retrieving local vcap: ', err.code);
    } else {
        vcapLocal = require("../vcap-local.json");
        console.log("Loaded local VCAP", vcapLocal);
        appEnvOpts = {
            vcap: vcapLocal
        };
        initializeAppEnv();
    }
});

// get the app environment from Cloud Foundry, defaulting to local VCAP
function initializeAppEnv() {
    appEnv = cfenv.getAppEnv(appEnvOpts);

    if (appEnv.isLocal) {
        require('dotenv').load();
    }

    if (appEnv.services.cloudantNoSQLDB) {
        initCloudant();
    } else {
        console.error("No Cloudant service exists.");
    }
}

// =====================================
// CLOUDANT SETUP ======================
// =====================================
var dba = "account";
var Account;

function initCloudant() {
    var cloudantURL = appEnv.services.cloudantNoSQLDB[0].credentials.url || appEnv.getServiceCreds("insurance-cloudant").url;
    var Cloudant = require('cloudant')({
      url: cloudantURL,
      plugin: 'retry',
      retryAttempts: 10,
      retryTimeout: 500
    });

    // Create the accounts DB if it doesn't exist
    Cloudant.db.create(dba, function(err, body) {
        if (err) {
            console.log("Database already exists: ", dba);
        } else {
            console.log("New database created: ", dba);
        }
    });
    Account = Cloudant.use(dba);
}


// =====================================
// DEFAULTS =====================
// =====================================
function createUserDefaults(account) {
}

// =====================================
// EXPORT LOGIN & SIGNUP ===============
// =====================================
module.exports = function(passport) {

    var bcrypt = require('bcrypt-nodejs');

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.username);
    });

    // used to deserialize the user
    passport.deserializeUser(function(username, done) {
        Account.find({
            selector: {
                username: username
            }
        }, function(err, result) {
            if (err) {
                return done(err);
            }
            var user = result.docs[0];
            done(null, user);
        });
    });

    passport.use('local-login', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        function(req, username, password, done) {

            console.log("Got login request");

            // Use Cloudant query to find the user
            Account.find({
                selector: {
                    'username': username
                }
            }, function(err, result) {
                if (err) {
                    console.log("There was an error finding the user: " + err);
                    return done(null, null, err);
                }
                if (result.docs.length === 0) {
                    console.log("Username was not found");
                    return done(null, false, "Username or password incorrect.");
                }

                // user was found, now determine if password matches
                var user = result.docs[0];
                if (bcrypt.compareSync(password, user.password)) {
                    console.log("Password matches");
                    return done(null, user, null);
                } else {
                    console.log("Password is not correct");
                    return done(null, null, "Username or password incorrect.");
                }
            });
        }
    ));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    passport.use('local-signup', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {
            console.log('Signup for: ', username);

            var firstName = req.body.fname;
            var lastName = req.body.lname;

            // Use Cloudant query to find the user just based on user name
            Account.find({
                selector: {
                    'username': username
                }
            }, function(err, result) {
                if (err) {
                    console.log("There was an error registering the user: " + err);
                    return done(null, null, err);
                } else if (result.docs.length > 0) {
                    console.log("Username was found");
                    return done(null, null, "User already exists. User another username address.");
                }

                // create the new user
                var hash_pass = bcrypt.hashSync(password);
                var user = {
                    "_id": username,
                    "username": username,
                    "password": hash_pass,
                    "fname": firstName,
                    "lname": lastName
                };

                Account.insert(user, function(err, body) {
                    if (err) {
                        console.log("There was an error registering the user: " + err);
                        return done(null, null, err);
                    } else {
                        console.log("User successfully registered.");
                        createUserDefaults(username);
                        // successful creation of the user
                        return done(null, user, null);
                    }
                });
            });
        }
    ));
};
