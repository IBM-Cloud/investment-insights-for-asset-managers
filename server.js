const express = require('express');
const app = express();
const path = require('path');
const cfenv = require('cfenv');
const http = require('https');
const bodyParser = require('body-parser');

//--Config------------------------------
require('dotenv').config();

//---Deployment Tracker---------------------------------------------------------
require("cf-deployment-tracker-client").track();

// configuration ===============================================================
// load local VCAP configuration
var vcapLocal = null
if (require('fs').existsSync('./vcap-local.json')) {
    try {
        vcapLocal = require("./vcap-local.json");
        //console.log("Loaded local VCAP", vcapLocal);
    } catch (e) {
        console.error(e);
    }
}

// get the app environment from Cloud Foundry, defaulting to local VCAP
var appEnvOpts = vcapLocal ? {
    vcap: vcapLocal
} : {}
var appEnv = cfenv.getAppEnv(appEnvOpts);

if (appEnv.isLocal) {
    require('dotenv').load();
}
var port = process.env.VCAP_APP_PORT || 3000;

// Main routes
app.use('/', express.static(__dirname +  '/'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// =====================================
// INVESTMENT PORTFOLIO SECTION =====================
// =====================================
//Portfolios POST & GET Methods
app.post('/api/portfolios', function(req, response){
  console.log("REQUEST:" + req.body.porfolioname);
   var basic_auth= toBase64();
   var portfolio_name = req.body.porfolioname || "default";
    var options = {
        "method": "POST",
        "hostname": process.env.INVESTMENT_PORFOLIO_BASE_URL,//"investment-portfolio.mybluemix.net",
        "port": null,
        "path": "/api/v1/portfolios",
        "headers": {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": "Basic "+basic_auth
        }
};

var req = http.request(options, function (res) {
  var chunks = [];
  console.log("AUTH:" + basic_auth);

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    //console.log(body.toString());
    response.end(body.toString());
  });
});

req.write(JSON.stringify({ closed: false,
  data: {'manager':'Vidyasagar Machupalli', 'worker':'John Doe' },
  name: portfolio_name,
  timestamp: currentISOTimestamp()}));
req.end();
});

app.get('/api/portfolios',function(req,response){
    const basic_auth= toBase64();
    var islatest = req.query.latest || true;
    var openOnly = req.query.openOnly || true; 

    var options = {
        "method": "GET",
        "hostname": process.env.INVESTMENT_PORFOLIO_BASE_URL,
        "port": null,
        "path": "/api/v1/portfolios?latest="+ islatest +"&openOnly=" + openOnly,
        "headers": {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": "Basic "+basic_auth
  }
};

var req = http.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    //console.log("RESPONSE:" + body.toString());
    response.setHeader('Content-Type','application/json');
    response.type('application/json');
    //response.write();
    response.end(body.toString());
  });
 
});
req.end();
});

//Holdings POST & GET methods
app.post("/api/holdings/:porfolioname",function (request,response){
const basic_auth = toBase64();
var portfolioname = request.params.porfolioname || "default";
var holdings = request.body.holdings;
var options = {
  "method": "POST",
  "hostname": process.env.INVESTMENT_PORFOLIO_BASE_URL,
  "port": null,
  "path": "/api/v1/portfolios/"+ portfolioname + "/holdings",
  "headers": {
    "accept": "application/json",
    "content-type": "application/json",
    "authorization": "Basic "+basic_auth
  }
};

var req = http.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
    response.send(JSON.parse(body.toString()));
  });
});

req.write(JSON.stringify({ holdings: holdings, timestamp: currentISOTimestamp() }));
//console.log(JSON.stringify({ holdings: holdings, timestamp: currentISOTimestamp() }));
req.end();
});

app.get("/api/holdings/:portfolioname",function(request,response){
  const basic_auth = toBase64();
  var portfolioname = request.params.portfolioname || "default";
  var latest = request.query.latest || "true";
  var options = {
  "method": "GET",
  "hostname": process.env.INVESTMENT_PORFOLIO_BASE_URL,
  "port": null,
  "path": "/api/v1/portfolios/"+ portfolioname + "/holdings?atDate="+ currentISOTimestamp() +"&latest=" + latest,
  "headers": {
    "accept": "application/json",
    "authorization": "Basic "+basic_auth
  }
};

var req = http.request(options, function (res) {
  var chunks = [];
  console.log("Options:"+options);

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
     response.setHeader('Content-Type','application/json');
    response.type('application/json');
    response.end(body.toString());
  });
});

req.end();
});

app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

//---------------------------
// PRIVATE FUNCTIONS
//---------------------------
//To generate basic authorization
function toBase64()
{
  var basic_auth= new Buffer(process.env.INVESTMENT_PORFOLIO_USERNAME + ':' + process.env.INVESTMENT_PORFOLIO_PASSWORD).toString('base64');
  return basic_auth;
}

function currentISOTimestamp()
{
  return new Date().toISOString();
}
// launch ======================================================================
app.listen(port, "0.0.0.0", function() {
    // print a message when the server starts listening
    console.log("server running on  http://localhost:" + port);
});
