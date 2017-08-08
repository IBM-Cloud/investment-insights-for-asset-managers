const express = require('express');
const app = express();
const path = require('path');
const cfenv = require('cfenv');
const http = require('https');
const bodyParser = require('body-parser');
const DiscoveryV1 = require('watson-developer-cloud/discovery/v1');
const fs = require('fs');
const _ = require('lodash');
var dateFormat = require('dateformat');

var FormData = require("form-data");
var requestmodule = require('request');

var port = process.env.VCAP_APP_PORT || 3000;
var vcapLocal = null;
// declare service variables
var INVESTMENT_PORFOLIO_BASE_URL,INVESTMENT_PORFOLIO_USERNAME,INVESTMENT_PORFOLIO_PASSWORD;
var DISCOVERY_USERNAME, DISCOVERY_PASSWORD;
var SCENARIO_INSTRUMENTS_URI,SCENARIO_INSTRUMENTS_ACCESS_TOKEN;
var PREDICTIVE_MARKET_SCENARIOS_ACCESS_TOKEN,PREDICTIVE_MARKET_SCENARIOS_URI;

if (process.env.VCAP_SERVICES)
{
    var env = JSON.parse(process.env.VCAP_SERVICES);

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

    if(env['fss-scenario-analytics-service'])
        {
            SCENARIO_INSTRUMENTS_URI = getHostName(env['fss-scenario-analytics-service'][0].credentials.uri);
            SCENARIO_INSTRUMENTS_ACCESS_TOKEN = env['fss-scenario-analytics-service'][0].credentials.accessToken;
        }
    else {
        console.log('You must bind the Scenario Analytics service to this application');
    }

    if(env['fss-predictive-scenario-analytics-service'])
        {
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
//app.use(upload.single());

//--Portfolios POST Methods - To Create single portfolios--------------------
app.post('/api/portfolios', function(req, response){
    //console.log("REQUEST:" + req.body.porfolioname);
    var basic_auth= toBase64();
    var portfolio_name = req.body.porfolioname || "default";
    var options = {
        "method": "POST",
        "hostname": INVESTMENT_PORFOLIO_BASE_URL || process.env.INVESTMENT_PORFOLIO_BASE_URL,//"investment-portfolio.mybluemix.net",
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
        //console.log("AUTH:" + basic_auth);

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

//Portfolios POST Methods - To Create multiple portfolios
app.post('/api/bulkportfolios', function(req, response){
    var basic_auth = toBase64();
    var requestBody = req.body;
    //console.log("REQUESTBODY" + JSON.stringify(requestBody));
    var options = {
        "method": "POST",
        "hostname": INVESTMENT_PORFOLIO_BASE_URL || process.env.INVESTMENT_PORFOLIO_BASE_URL,
        "port": null,
        "path": "/api/v1/bulk_portfolios",
        "headers": {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": "Basic "+basic_auth
        }
    };

    var req = http.request(options, function (res) {
        var chunks = [];
        //console.log("AUTH:" + basic_auth);

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            var body = Buffer.concat(chunks);
            //console.log(body.toString());
            response.end(body.toString());
        });
    });
    req.write(JSON.stringify(requestBody));
    req.end();
});

//--Portfolios GET Methods--------------------
app.get('/api/portfolios',function(req,response){
    const basic_auth = toBase64();
    var islatest = req.query.latest || true;
    var openOnly = req.query.openOnly || false;

    var options = {
        "method": "GET",
        "hostname": INVESTMENT_PORFOLIO_BASE_URL || process.env.INVESTMENT_PORFOLIO_BASE_URL,
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

//--Holdings POST methods--------------------
app.post("/api/holdings/:porfolioname",function (request,response){
    const basic_auth = toBase64();
    var portfolioname = request.params.porfolioname || "default";
    var holdings = request.body.holdings;
    var options = {
        "method": "POST",
        "hostname": INVESTMENT_PORFOLIO_BASE_URL || process.env.INVESTMENT_PORFOLIO_BASE_URL,
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
            //console.log(body.toString());
            response.send(JSON.parse(body.toString()));
        });
    });

    req.write(JSON.stringify({ holdings: holdings, timestamp: currentISOTimestamp() }));
    //console.log(JSON.stringify({ holdings: holdings, timestamp: currentISOTimestamp() }));
    req.end();
});

//--Holdings GET methods--------------------
app.get("/api/holdings/:portfolioname",function(request,response){
    const basic_auth = toBase64();
    var portfolioname = request.params.portfolioname || "default";
    var latest = request.query.latest || "true";
    var options = {
        "method": "GET",
        "hostname": INVESTMENT_PORFOLIO_BASE_URL || process.env.INVESTMENT_PORFOLIO_BASE_URL,
        "port": null,
        "path": "/api/v1/portfolios/"+ portfolioname + "/holdings?atDate="+ currentISOTimestamp() +"&latest=" + latest,
        "headers": {
            "accept": "application/json",
            "authorization": "Basic "+basic_auth
        }
    };

    var req = http.request(options, function (res) {
        var chunks = [];
        //console.log("Options:"+options);

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            var body = Buffer.concat(chunks);
            //console.log(body.toString());
            response.setHeader('Content-Type','application/json');
            response.type('application/json');
            response.send(body.toString());
        });
    });

    req.end();
});


//--Discovery News POST returning 20 results--------------------
app.post("/api/news/:company", function (req, res) {
    
    // Getting date from Angular radio buttons
    var getDay = req.body.daysDate;
    var newDate = Date.now('dd:mm:yyyy') + getDay *24*3600*1000; // days ago in milliseconds
    var filterDay = dateFormat(newDate, "yyyy-mm-dd");

    discovery.query({
        environment_id: "system",
        collection_id: "news",
        query: req.body.company,
        count: 20,
        count: 20,
        return: "score,url,host,text,publication_date,enriched_text.sentiment,title",
        aggregations: [""],
        filter: "publication_date > " + filterDay,
        sort: "-_sort"
    }, function(err, response) {
        if (err) {
            console.log(err);
        } else {
            //console.log(response);
            
            // skip the loop for each news element where if host == gamezone and military
            var newResponse = [];
            response.results.forEach(function(item) {
                //console.log(item);
                if(item.host =="www.military.com" || item.host =="www.gamezone.com" || item.host =="barrons.com") {    
                    return;
                }
                newResponse.push(item);
            });
            response.results = newResponse;
            res.send(response);
        }
    });
});


// Getting date from Angular radio buttons
var getDay = -1;
var newDate = Date.now('dd:mm:yyyy') + getDay *24*3600*1000; // days ago in milliseconds
var filterDay = dateFormat(newDate, "yyyy-mm-dd");

//--Discovery News GET--------------------
app.get("/api/news", function (req, res) {
    discovery.query({
        environment_id: "system",
        collection_id: "news",
        query: "S&P 500",
        count: 20,
        return: "score,url,host,text,publication_date,enriched_text.sentiment,title",
        aggregations: [""],
        filter: "publication_date > " + filterDay,
        sort: ""
    }, function(err, response) {
        if (err) {
            console.log(err);
        } else {

            // skip the loop for each news element where if host == gamezone and military
            var newResponse = [];
            response.results.forEach(function(item) {
                if(item.host =="www.military.com" || item.host =="www.gamezone.com") {    
                    return;
                }
                newResponse.push(item);
            });
            response.results = newResponse;
            res.send(response);
        }
    });
});


//--Predictive Market Scenarios Service POST-----------
app.post('/api/generatepredictive',function(request,response){
    var req_body = JSON.stringify(request.body);
    //console.log(request.body);
    const risk_factor = request.body.market_change.risk_factor || "CX_COS_ME_Gold_XCEC";
    const shock_value = request.body.market_change.shock || 1.1;
    var options = {
        "method": "POST",
        "hostname": PREDICTIVE_MARKET_SCENARIOS_URI || process.env.PREDICTIVE_MARKET_SCENARIOS_URI,
        "port": null,
        "path": "/api/v1/scenario/generate_predictive",
        "headers": {
            "accept": "application/json",
            "content-type": "application/json",
            "X-IBM-Access-Token": PREDICTIVE_MARKET_SCENARIOS_ACCESS_TOKEN || process.env.PREDICTIVE_MARKET_SCENARIOS_ACCESS_TOKEN
        }
    };

    // Set up the request
 var req = http.request(options, function (res) {
        var chunks = [];
        //console.log("Options:"+options);

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            var body = Buffer.concat(chunks);
            response.send(toCSV(body.toString(),risk_factor,shock_value));
            
        });
    });
    req.write(req_body);
    req.end();
});

//-- Simulated Instrument Analysis Service POST-----
app.post('/api/instruments/:riskfactor/:shockvalue',function(request,response){
    const risk_factor = request.params.riskfactor || "CX_COS_ME_Gold_XCEC";
    const predictive_url = risk_factor + (request.params.shockvalue || 1.1)*10;
    var formData = {
    instruments: request.body.instrumentslist.toString() || "CX_US037833CM07_USD",
    scenario_file: fs.createReadStream(__dirname + '/app/data/predictiveMarketScenarios/predictivescenarios'+ predictive_url +'.csv'),
    };

    var req = requestmodule.post({
        url:'https://'+ (SCENARIO_INSTRUMENTS_URI || process.env.SIMULATED_INSTRUMENT_ANALYSIS_URI) +'/api/v1/scenario/instruments',
        formData:formData
        },requestCallback);
    //r._form = form;
    req.setHeader('enctype',"multipart/form-data");
    req.setHeader('x-ibm-access-token', SCENARIO_INSTRUMENTS_ACCESS_TOKEN ||process.env.SIMULATED_INSTRUMENT_ANALYSIS_ACCESS_TOKEN);
    if(risk_factor !== "CX_COS_ME_Gold_XCEC")
        {
            fs.unlink(__dirname + '/app/data/predictiveMarketScenarios/predictivescenarios'+ predictive_url +'.csv', (err) => {
                if (err) throw err;
                console.log('successfully deleted');
            });
        }
    function requestCallback(err, res, body) {
    //console.log("BODY"+body);
    //console.log("RESPONSE:"+ JSON.stringify(res));
    response.setHeader('Content-Type','application/json');
    response.type('application/json');
    response.send(body);
    }
});

//--All other routes to be sent to home page--------------------
app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname + '/app/index.html'));
});


//--BASE FUNCTION FOR authorization used by the INVESTMENT PORTFOLIO service--------------------
function toBase64()
{
    var basic_auth= new Buffer((INVESTMENT_PORFOLIO_USERNAME || process.env.INVESTMENT_PORFOLIO_USERNAME) + ':' + (INVESTMENT_PORFOLIO_PASSWORD || process.env.INVESTMENT_PORFOLIO_PASSWORD)).toString('base64');
    return basic_auth;
}

function currentISOTimestamp(){
    return new Date().toISOString();
}

function getHostName(url)
{
    var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
    if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
        //console.log("HOSTNAME:" + match[2]);
        return match[2];
    }
    else {
        return null;
    }
}

function toCSV(datatowrite,riskfactor,shockvalue){
    fs.writeFile(path.join(__dirname + '/app/data/predictiveMarketScenarios/predictivescenarios'+ riskfactor + (shockvalue * 10) +'.csv'), datatowrite, 'utf8', function (err) {
        if (err) {
            console.log(err);
            console.log('Some error occured - file either not saved or corrupted file saved.');
        } 
        else {
            console.log('It\'s saved!');
        }   
    });
}

//--launch--------------------
app.listen(port, "0.0.0.0", function() {
    // print a message when the server starts listening
    console.log("server running on  http://localhost:" + port);
});