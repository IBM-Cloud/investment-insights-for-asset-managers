const express = require('express');
const path = require('path');
const cfenv = require('cfenv');
const bodyParser = require('body-parser');
const DiscoveryV1 = require('watson-developer-cloud/discovery/v1');

const app = express();

var port = process.env.VCAP_APP_PORT || 3000;
var vcapLocal = null;
// declare service variables
var INVESTMENT_PORFOLIO_BASE_URL,INVESTMENT_PORFOLIO_USERNAME,INVESTMENT_PORFOLIO_PASSWORD;
var DISCOVERY_USERNAME, DISCOVERY_PASSWORD;
var SCENARIO_INSTRUMENTS_URI,SCENARIO_INSTRUMENTS_ACCESS_TOKEN;
var PREDICTIVE_MARKET_SCENARIOS_ACCESS_TOKEN,PREDICTIVE_MARKET_SCENARIOS_URI;

if (process.env.VCAP_SERVICES) {
  const env = JSON.parse(process.env.VCAP_SERVICES);

  // Find the service
  if (env['fss-portfolio-service']) {
    INVESTMENT_PORFOLIO_BASE_URL = getHostName(env['fss-portfolio-service'][0].credentials.url);
    INVESTMENT_PORFOLIO_USERNAME = env['fss-portfolio-service'][0].credentials.writer.userid;
    INVESTMENT_PORFOLIO_PASSWORD = env['fss-portfolio-service'][0].credentials.writer.password;
  }

  // Find the service
  if (env['discovery']) {
    console.log("username: " + env['discovery'][0].credentials.username);
    INVESTMENT_PORFOLIO_BASE_URL = getHostName(env['fss-portfolio-service'][0].credentials.url);
    DISCOVERY_USERNAME = env['discovery'][0].credentials.username;
    DISCOVERY_PASSWORD = env['discovery'][0].credentials.password;
  }

  if (env['fss-scenario-analytics-service']) {
    SCENARIO_INSTRUMENTS_URI = getHostName(env['fss-scenario-analytics-service'][0].credentials.uri);
    SCENARIO_INSTRUMENTS_ACCESS_TOKEN = env['fss-scenario-analytics-service'][0].credentials.accessToken;
  } else {
    console.log('You must bind the Scenario Analytics service to this application');
  }

  if (env['fss-predictive-scenario-analytics-service']) {
    PREDICTIVE_MARKET_SCENARIOS_URI = getHostName(env['fss-predictive-scenario-analytics-service'][0].credentials.uri);
    PREDICTIVE_MARKET_SCENARIOS_ACCESS_TOKEN = env['fss-predictive-scenario-analytics-service'][0].credentials.accessToken;
  }
}

//--Config--------------------
require('dotenv').config();

//--Deployment Tracker--------------------
require("cf-deployment-tracker-client").track();

//--Get the app environment from Cloud Foundry, defaulting to local VCAP--------------------
var appEnvOpts = vcapLocal ? {
    vcap: vcapLocal
} : {}
var appEnv = cfenv.getAppEnv(appEnvOpts);

if (appEnv.isLocal) {
    require('dotenv').load();
}

//--Discovery service setup--------------------
var discovery_usernameLocal =  process.env.DISCOVERY_USERNAME;
var discovery_passwordLocal = process.env.DISCOVERY_PASSWORD;
var discovery_environment_id = process.env.DISCOVERY_environment_id;
var discovery_collection_id = process.env.DISCOVERY_collection_id;

var discovery = new DiscoveryV1({
  username: discovery_usernameLocal || DISCOVERY_USERNAME,
  password: discovery_passwordLocal || DISCOVERY_PASSWORD,
  version_date: '2017-08-01'
});

//--Setting up the middle ware--------------------
app.use('/', express.static(__dirname + '/app'));
//TODO:Remove
app.use('/node_modules',express.static(__dirname + '/node_modules'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(require('./routes/portfolios.js')({
  baseUrl: INVESTMENT_PORFOLIO_BASE_URL || process.env.INVESTMENT_PORFOLIO_BASE_URL,
  userid: INVESTMENT_PORFOLIO_USERNAME || process.env.INVESTMENT_PORFOLIO_USERNAME,
  password: INVESTMENT_PORFOLIO_PASSWORD || process.env.INVESTMENT_PORFOLIO_PASSWORD,
}));
app.use(require('./routes/news.js')(discovery));
app.use(require('./routes/simulation')({
  uri: SCENARIO_INSTRUMENTS_URI || process.env.SIMULATED_INSTRUMENT_ANALYSIS_URI,
  accessToken: SCENARIO_INSTRUMENTS_ACCESS_TOKEN || process.env.SIMULATED_INSTRUMENT_ANALYSIS_ACCESS_TOKEN
}, {
  uri: PREDICTIVE_MARKET_SCENARIOS_URI || process.env.PREDICTIVE_MARKET_SCENARIOS_URI,
  accessToken: PREDICTIVE_MARKET_SCENARIOS_ACCESS_TOKEN || process.env.PREDICTIVE_MARKET_SCENARIOS_ACCESS_TOKEN
}));

//--All other routes to be sent to home page--------------------
app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname + '/app/index.html'));
});

function getHostName(url) {
  var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
  if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
    return match[2];
  } else {
    return null;
  }
}

//--launch--------------------
app.listen(port, "0.0.0.0", () => {
  // print a message when the server starts listening
  console.log("server running on  http://localhost:" + port);
});
