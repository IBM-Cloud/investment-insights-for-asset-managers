const express = require('express');
const session = require('express-session');
const path = require('path');
const cfenv = require('cfenv');
const bodyParser = require('body-parser');
const DiscoveryV1 = require('watson-developer-cloud/discovery/v1');

const app = express();

// declare service variables
let INVESTMENT_PORFOLIO_BASE_URL, INVESTMENT_PORFOLIO_USERNAME, INVESTMENT_PORFOLIO_PASSWORD;
let DISCOVERY_USERNAME, DISCOVERY_PASSWORD;
let SCENARIO_INSTRUMENTS_URI, SCENARIO_INSTRUMENTS_ACCESS_TOKEN;
let PREDICTIVE_MARKET_SCENARIOS_ACCESS_TOKEN, PREDICTIVE_MARKET_SCENARIOS_URI;
let APPID_TENANTID, APPID_CLIENTID, APPID_SECRET, APPID_OAUTHSERVERURL;

if (process.env.VCAP_SERVICES) {
  const env = JSON.parse(process.env.VCAP_SERVICES);

  // Find the service
  if (env['fss-portfolio-service']) {
    INVESTMENT_PORFOLIO_BASE_URL = getHostName(env['fss-portfolio-service'][0].credentials.url);
    INVESTMENT_PORFOLIO_USERNAME = env['fss-portfolio-service'][0].credentials.writer.userid;
    INVESTMENT_PORFOLIO_PASSWORD = env['fss-portfolio-service'][0].credentials.writer.password;
  }

  // Find the service
  if (env.discovery) {
    DISCOVERY_USERNAME = env.discovery[0].credentials.username;
    DISCOVERY_PASSWORD = env.discovery[0].credentials.password;
  }

  // Find the service
  if (env['fss-scenario-analytics-service']) {
    SCENARIO_INSTRUMENTS_URI = getHostName(env['fss-scenario-analytics-service'][0].credentials.uri);
    SCENARIO_INSTRUMENTS_ACCESS_TOKEN = env['fss-scenario-analytics-service'][0].credentials.accessToken;
  } else {
    console.log('You must bind the Scenario Analytics service to this application');
  }

  // Find the service
  if (env['fss-predictive-scenario-analytics-service']) {
    PREDICTIVE_MARKET_SCENARIOS_URI = getHostName(env['fss-predictive-scenario-analytics-service'][0].credentials.uri);
    PREDICTIVE_MARKET_SCENARIOS_ACCESS_TOKEN = env['fss-predictive-scenario-analytics-service'][0].credentials.accessToken;
  }

  // Find the service
  if (env.AppID) {
    APPID_TENANTID = env.AppID[0].credentials.tenantId;
    APPID_CLIENTID = env.AppID[0].credentials.clientId;
    APPID_SECRET = env.AppID[0].credentials.secret;
    APPID_OAUTHSERVERURL = env.AppID[0].credentials.oauthServerUrl;
  }
}

// --Config--------------------
require('dotenv').config();

// --Deployment Tracker--------------------
require('cf-deployment-tracker-client').track();

// --Get the app environment from Cloud Foundry, defaulting to local VCAP--------------------
var vcapLocal = null;
var appEnvOpts = vcapLocal ? {
  vcap: vcapLocal
} : {};
var appEnv = cfenv.getAppEnv(appEnvOpts);

if (appEnv.isLocal) {
  require('dotenv').load();
}

var port = process.env.VCAP_APP_PORT || appEnv.port;

// --Discovery service setup--------------------
var discoveryUsernameLocal = process.env.DISCOVERY_USERNAME;
var discoveryPasswordLocal = process.env.DISCOVERY_PASSWORD;

var discovery = new DiscoveryV1({
  username: discoveryUsernameLocal || DISCOVERY_USERNAME,
  password: discoveryPasswordLocal || DISCOVERY_PASSWORD,
  version_date: '2017-08-01'
});

// --Setting up the middle ware--------------------
app.use(session({
  secret: 'finance-trade-app',
  resave: true,
  saveUninitialized: true
}));
app.use('/', express.static(`${__dirname}/app`));
app.use('/node_modules', express.static(`${__dirname}/node_modules`));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// routes for user authentication
app.use(require('./routes/auth.js')(app, {
  tenantId: APPID_TENANTID || process.env.APPID_TENANTID,
  clientId: APPID_CLIENTID || process.env.APPID_CLIENTID,
  secret: APPID_SECRET || process.env.APPID_SECRET,
  oauthServerUrl: APPID_OAUTHSERVERURL || process.env.APPID_OAUTHSERVERURL,
  redirectUri: `${appEnv.url}/auth/callback`
}));

// protect all routes under /api/v1
function checkAuthenticated(req, res, next) {
  // if (req.session && req.session.logged) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.sendStatus(401);
  }
}
app.use('/api/v1/', checkAuthenticated);

// register API routes
app.use(require('./routes/portfolios.js')({
  baseUrl: INVESTMENT_PORFOLIO_BASE_URL || process.env.INVESTMENT_PORFOLIO_BASE_URL,
  userid: INVESTMENT_PORFOLIO_USERNAME || process.env.INVESTMENT_PORFOLIO_USERNAME,
  password: INVESTMENT_PORFOLIO_PASSWORD || process.env.INVESTMENT_PORFOLIO_PASSWORD,
}));
app.use(require('./routes/news.js')(discovery));
app.use(require('./routes/simulation')({
  uri: SCENARIO_INSTRUMENTS_URI || process.env.SIMULATED_INSTRUMENT_ANALYSIS_URI,
  accessToken: SCENARIO_INSTRUMENTS_ACCESS_TOKEN ||
    process.env.SIMULATED_INSTRUMENT_ANALYSIS_ACCESS_TOKEN
}, {
  uri: PREDICTIVE_MARKET_SCENARIOS_URI || process.env.PREDICTIVE_MARKET_SCENARIOS_URI,
  accessToken: PREDICTIVE_MARKET_SCENARIOS_ACCESS_TOKEN ||
    process.env.PREDICTIVE_MARKET_SCENARIOS_ACCESS_TOKEN
}));

// --All other routes to be sent to home page--------------------
app.get('/*', (req, res) => {
  res.sendFile(path.join(`${__dirname}/app/index.html`));
});

function getHostName(url) {
  var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
  if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
    return match[2];
  } else {
    return null;
  }
}

// --launch--------------------
app.listen(port, '0.0.0.0', () => {
  // print a message when the server starts listening
  console.log(`server running on  http://localhost:${port}`);
});
