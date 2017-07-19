const express = require('express');
const app = express();
const path = require('path');
const cfenv = require('cfenv');
const http = require('https');
const bodyParser = require('body-parser');
const DiscoveryV1 = require('watson-developer-cloud/discovery/v1');

var port = process.env.VCAP_APP_PORT || 3000;
var vcapLocal = null;

//--Temp setup of discovery service--------------------
// var discovery = new DiscoveryV1({
//     username: '',
//     password: '',
//     version_date: '2017-07-19'
// });

//--Config--------------------
require('dotenv').config();

//--Deployment Tracker--------------------
require("cf-deployment-tracker-client").track();

//--load local VCAP configuration--------------------
if (require('fs').existsSync('./vcap-local.json')) {
    try {
        vcapLocal = require("./vcap-local.json");
        //console.log("Loaded local VCAP", vcapLocal);
    } catch (e) {
        console.error(e);
    }
}

//--Get the app environment from Cloud Foundry, defaulting to local VCAP--------------------
var appEnvOpts = vcapLocal ? {
    vcap: vcapLocal
} : {}
var appEnv = cfenv.getAppEnv(appEnvOpts);

if (appEnv.isLocal) {
    require('dotenv').load();
}

//--Setting up the middle ware--------------------
app.use('/', express.static(__dirname +  '/'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



//--Portfolios POST Methods - To Create single portfolios--------------------
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

//Portfolios POST Methods - To Create multiple portfolios
app.post('/api/bulkportfolios', function(req, response){
    var basic_auth= toBase64();
    var requestBody = req.body;
    console.log("REQUESTBODY" + JSON.stringify(requestBody));
    var options = {
        "method": "POST",
        "hostname": process.env.INVESTMENT_PORFOLIO_BASE_URL,//"investment-portfolio.mybluemix.net",
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
        console.log("AUTH:" + basic_auth);

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            var body = Buffer.concat(chunks);
            console.log(body.toString());
            response.end(body.toString());
        });
    });

    req.write(JSON.stringify(requestBody));
    req.end();
});

//--Portfolios GET Methods--------------------
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

//--Holdings POST methods--------------------
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

//--Holdings GET methods--------------------
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


//--Discovery News GET--------------------
// app.get('/api/news',function(req,res){
//     discovery.query({
//         environment_id: '7194d449-dc7e-4f82-939c-3c9205a0a701',
//         collection_id: '4f444003-d770-4c27-8e17-8f6b43d9952a',
//         query: 'entities.text:IBM'
//     }, function(err, response) {
//         if (err) {
//             console.error(err);
//         } else {
//             console.log(JSON.stringify(response, null, 2));
//             res.json(response);
//         }
//     });
// });


//--All other routes to be sent to home page--------------------
app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});


//--BASE FUNCTION FOR authorization used by the INVESTMENT PORTFOLIO service--------------------
function toBase64()
{
    var basic_auth= new Buffer(process.env.INVESTMENT_PORFOLIO_USERNAME + ':' + process.env.INVESTMENT_PORFOLIO_PASSWORD).toString('base64');
    return basic_auth;
}

function currentISOTimestamp()
{
    return new Date().toISOString();
}


//--launch--------------------
app.listen(port, "0.0.0.0", function() {
    // print a message when the server starts listening
    console.log("server running on  http://localhost:" + port);
});