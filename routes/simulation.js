var express = require('express');
var async = require('async');
var request = require('request');

var router = express.Router();
var SimulatedCredentials;
var PredictiveCredentials;

router.post('/api/v1/simulation', (req, res) => {
  console.log('Run simulation with', req.body);
  async.waterfall([
    // generate predictive file
    (callback) => {
      var options = {
        method: 'POST',
        url: `https://${PredictiveCredentials.uri}/api/v1/scenario/generate_predictive`,
        headers: {
          'Content-Type': 'application/json',
          'X-IBM-Access-Token': PredictiveCredentials.accessToken
        },
        body: JSON.stringify({
          market_change: {
            risk_factor: req.body.riskFactor.id,
            shock: req.body.shockValue
          }
        })
      };
      request(options, (err, response, body) => {
        if (err) {
          callback(err);
        } else if (body.error) {
          callback(body.error);
        } else {
          callback(null, body);
        }
      });
    },
    // call simulated instrument service
    (csvFileContent, callback) => {
      var options = {
        method: 'POST',
        url: `https://${SimulatedCredentials.uri}/api/v1/scenario/instruments`,
        headers: {
          'Content-Type': 'multipart/form-data',
          accept: 'application/json',
          enctype: 'multipart/form-data',
          'X-IBM-Access-Token': SimulatedCredentials.accessToken
        },
        formData: {
          instruments: req.body.instrumentIds.toString(),
          scenario_file: {
            value: csvFileContent,
            options: {
              filename: 'predictions.csv',
              contentType: 'text/plain'
            }
          }
        },
        json: true
      };
      request(options, (err, response, body) => {
        if (err) {
          callback(err);
        } else if (body.error) {
          callback(body.error);
        } else {
          callback(null, body);
        }
      });
    }
  ], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send({ ok: false });
    } else {
      res.send(result);
    }
  });
});

module.exports = (simulatedCredentials, predictiveCredentials) => {
  SimulatedCredentials = simulatedCredentials;
  PredictiveCredentials = predictiveCredentials;
  return router;
};
