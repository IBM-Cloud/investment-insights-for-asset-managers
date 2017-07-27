const express = require('express');
const app = express();
const path = require('path');
const cfenv = require('cfenv');
const http = require('https');
const bodyParser = require('body-parser');
const DiscoveryV1 = require('watson-developer-cloud/discovery/v1');
var fs = require('fs');
//var multer  = require('multer')
//var upload = multer({ dest: 'tmp/' })
var FormData = require("form-data");
var requestmodule = require('request');

var port = process.env.VCAP_APP_PORT || 3000;
var vcapLocal = null;
// declare service variables
var INVESTMENT_PORFOLIO_BASE_URL,INVESTMENT_PORFOLIO_USERNAME,INVESTMENT_PORFOLIO_PASSWORD;
var DISCOVERY_USERNAME, DISCOVERY_PASSWORD;
var SCENARIO_INSTRUMENTS_URI,SCENARIO_INSTRUMENTS_ACCESS_TOKEN;

if (process.env.VCAP_SERVICES)
{
    var env = JSON.parse(process.env.VCAP_SERVICES);

    // Find the service
    if (env['fss-portfolio-service']) {
        //console.log("URL " + getHostName(env['fss-portfolio-service'][0].credentials.url));
        // console.log("userid "+ env['fss-portfolio-service'][0].credentials.writer.userid);
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
        console.log('You must bind the Investment Portfolio service to this application');
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
// var discovery_environment_id = process.env.DISCOVERY_environment_id;
// var discovery_collection_id = process.env.DISCOVERY_collection_id;
var discovery_environment_id = '6da0267e-7fa2-46ff-9086-f093dcff3961';
var discovery_collection_id = 'f4f53ecc-4307-4c54-b8e0-018df036e12d';

// Temp api credentials - this service will be removed
var discovery = new DiscoveryV1({
    // username: discovery_usernameLocal || DISCOVERY_USERNAME,
    // password: discovery_passwordLocal || DISCOVERY_PASSWORD,
    username: 'bde04da9-aac0-4c8f-83e5-93cf5c68535a',
    password: 'DarQsrwRjyOR',
    version_date: '2017-07-19'
});

// console.log('Before environment_id ');
// discovery.getEnvironment(('{environment_id}'), function(error, data) {
//     console.log(JSON.stringify(data, null, 2));
// });
// console.log('After environment_id ');

//--Setting up the middle ware--------------------
app.use('/', express.static(__dirname +  '/'));
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


//--Discovery News GET--------------------
app.get('/api/news',function(req,res){
    discovery.query({
        environment_id: '6da0267e-7fa2-46ff-9086-f093dcff3961',
        collection_id: 'f4f53ecc-4307-4c54-b8e0-018df036e12d',
        query: 'Honeywell International Inc',
        count: 20,
        return: "title,enrichedTitle.text,url,host,docSentiment,totalTransactions,yyyymmdd",
        aggregations: [
            "term(docSentiment.type,count:3)",
            "nested(enrichedTitle.entities).filter(enrichedTitle.entities.type:Company).term(enrichedTitle.entities.text)",
            "nested(enrichedTitle.entities).filter(enrichedTitle.entities.type:Person).term(enrichedTitle.entities.text)",
            "term(enrichedTitle.concepts.text)",
            "term(blekko.basedomain).term(docSentiment.type:positive)",
            "term(docSentiment.type)",
            "min(docSentiment.score)",
            "max(docSentiment.score)",
            "filter(enrichedTitle.entities.type::Company).term(enrichedTitle.entities.text).timeslice(blekko.chrondate,1day).term(docSentiment.type:positive)"
        ],
        filter: "blekko.hostrank>20,blekko.chrondate>1495234800,blekko.chrondate<1500505200",
        sort: "-_score"
    }, function(err, response) {
        if (err) {
            console.error(err);
        } else {
            var docSentiment2 = JSON.stringify(response.results, null, 2);
            res.json(response);
        }
    });
});

//--Discovery News POST returning 6 results--------------------
app.post("/api/news/:company", function (req, res) {
    discovery.query({
        environment_id: '6da0267e-7fa2-46ff-9086-f093dcff3961',
        collection_id: 'f4f53ecc-4307-4c54-b8e0-018df036e12d',
        query: req.body.company,
        count: 20,
        return: "title,enrichedTitle.text,url,host,docSentiment,totalTransactions,yyyymmdd",
        aggregations: [
            "term(docSentiment.type,count:3)",
            "nested(enrichedTitle.entities).filter(enrichedTitle.entities.type:Company).term(enrichedTitle.entities.text)",
            "nested(enrichedTitle.entities).filter(enrichedTitle.entities.type:Person).term(enrichedTitle.entities.text)",
            "term(enrichedTitle.concepts.text)",
            "term(blekko.basedomain).term(docSentiment.type:positive)",
            "term(docSentiment.type)",
            "min(docSentiment.score)",
            "max(docSentiment.score)",
            "filter(enrichedTitle.entities.type::Company).term(enrichedTitle.entities.text).timeslice(blekko.chrondate,1day).term(docSentiment.type:positive)"
        ],
        filter: "blekko.hostrank>20,blekko.chrondate>1495234800,blekko.chrondate<1500505200",
        sort: "-_score"
    }, function(err, response) {
        if (err) {
            console.log(err);
        } else {
            res.send(response);
        }
    });
});



//--Predictive Market Scenarios Service POST-----------
app.post('/api/generatepredictive',function(request,response){

   // if(!fs.existsSync('data/predictivescenarios.csv'))
    //{
    var req_body = JSON.stringify(request.body);
    //console.log(req_body);
    var options = {
        "method": "POST",
        "hostname": process.env.PREDICTIVE_MARKET_SCENARIOS_URI,
        "port": null,
        "path": "/api/v1/scenario/generate_predictive",
        "headers": {
            "accept": "application/json",
            "content-type": "application/json",
            "X-IBM-Access-Token": process.env.PREDICTIVE_MARKET_SCENARIOS_ACCESS_TOKEN
        }
    };

    // Set up the request
 var req = http.request(options, function (res) {
        var chunks = [];
        console.log("Options:"+options);

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            var body = Buffer.concat(chunks);
            //console.log(body.toString());
            //response.setHeader('Content-Type','application/json');
            //response.type('application/json');
            response.send(toCSV(body.toString()));
            //toCSV(body.toString());
        });
    });
    req.write(req_body);
    req.end();
   /* }
  else
    {
        response.setHeader('Content-Type','application/json');
        response.type('application/json');
        response.send(JSON.stringify("{'error':'file exists'}"));
    }*/
});


//-- Simulated Instrument Analysis Service POST-----
app.post('/api/instruments/:instruments',function(request,response){

    if(fs.existsSync('data/predictiveMarketScenarios/predictivescenarios.csv'))
    {
            //console.log(request.params.instruments);
            var formData = {
            instruments: request.params.instruments || "CX_US037833CM07_USD",
            scenario_file: fs.createReadStream(__dirname + '/data/predictiveMarketScenarios/predictivescenarios.csv'),
            };

            var req = requestmodule.post(
                {
                   url:'https://'+ (SCENARIO_INSTRUMENTS_URI || process.env.SIMULATED_INSTRUMENT_ANALYSIS_URI) +'/api/v1/scenario/instruments',
                   formData:formData
                },requestCallback);
            //r._form = form;
            req.setHeader('enctype',"multipart/form-data");
            req.setHeader('x-ibm-access-token', SCENARIO_INSTRUMENTS_ACCESS_TOKEN ||process.env.SIMULATED_INSTRUMENT_ANALYSIS_ACCESS_TOKEN);
            
            function requestCallback(err, res, body) {
            //console.log("BODY"+body);
            //console.log("RESPONSE:"+ JSON.stringify(res));
            response.setHeader('Content-Type','application/json');
            response.type('application/json');
            response.send(body);
            }
    }
});


//--All other routes to be sent to home page--------------------
app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
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

function toCSV(datatowrite)
{
    fs.writeFile('data/predictivescenarios.csv', datatowrite, 'utf8', function (err) {
  if (err) {
    console.log('Some error occured - file either not saved or corrupted file saved.');
  } else{
    console.log('It\'s saved!');
  }
});
}

//--launch--------------------
app.listen(port, "0.0.0.0", function() {
    // print a message when the server starts listening
    console.log("server running on  http://localhost:" + port);
});