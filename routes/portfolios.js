var express = require('express');
var request = require('request-promise');
var fs = require('fs');

var router = express.Router();
var Credentials = {
  baseUrl: '',
  userid: '',
  password: '',
};

router.get('/api/v1/portfolios', (req, res) => {
  console.log('Retrieving portfolios...');
  var islatest = req.query.latest || true;
  var openOnly = req.query.openOnly || false;
  var getPortfoliosRequest = {
    method: 'GET',
    url: `https://${Credentials.baseUrl}/api/v1/portfolios?latest=${islatest}&openOnly=${openOnly}`,
    auth: {
      user: Credentials.userid,
      password: Credentials.password,
    },
    json: true,
  };

  request(getPortfoliosRequest)
    // get existing portfolios
    .then((result) => {
      if (result.portfolios && result.portfolios.length > 0) {
        console.log('Found', result);
        res.send(result);
        throw new Error('processed');
      }
    })
    // if we reach this point it means we have no portfolio yet, create some
    .then(() => {
      var defaultPortfolios = JSON.parse(fs.readFileSync(`${__dirname}/../app/data/investmentPortfolio/portfolio/portfolios.json`));
      var currentdate = currentISOTimestamp();
      defaultPortfolios.portfolios.forEach((portfolio) => {
        portfolio.timestamp = currentdate;
      });
      var postPortfoliosRequest = {
        method: 'POST',
        url: `https://${Credentials.baseUrl}/api/v1/bulk_portfolios`,
        auth: {
          user: Credentials.userid,
          password: Credentials.password,
        },
        json: true,
        body: defaultPortfolios
      };
      console.log('No portfolio found. Injecting default...', defaultPortfolios);
      return request(postPortfoliosRequest);
    })
    // wait for the result
    .then((result) => {
      console.log('Created default portfolios', result);
    })
    // and query the portfolios again
    .then(() => request(getPortfoliosRequest).then((result) => {
      res.send(result);
    }))
    //
    .catch((err) => {
      if (err && err.message === 'processed') {
        return;
      }

      console.log(err);
      res.status(500).send({ ok: false });
    });
});

router.get('/api/v1/portfolios/:portfolioname/holdings', (req, res) => {
  var portfolioname = req.params.portfolioname;
  var latest = req.query.latest || true;
  var getHoldingsRequest = {
    method: 'GET',
    url: `https://${Credentials.baseUrl}/api/v1/portfolios/${encodeURIComponent(portfolioname)}/holdings?atDate=${currentISOTimestamp()}&latest=${latest}`,
    auth: {
      user: Credentials.userid,
      password: Credentials.password,
    },
    json: true,
  };

  request(getHoldingsRequest)
    // get existing holdings
    .then((result) => {
      if (result.holdings && result.holdings.length > 0) {
        console.log('Found', result);
        res.send(result);
        throw new Error('processed');
      }
    })
    // if we reach this point it means we have no holdings yet, create some
    .then(() => {
      var defaultHoldings = {
        holdings: [{
          holdings: JSON.parse(fs.readFileSync(`${__dirname}/../app/data/investmentPortfolio/holdings/${portfolioname}_holdings.json`)).holdings,
          timestamp: currentISOTimestamp()
        }]
      };
      var postHoldingsRequest = {
        method: 'POST',
        url: `https://${Credentials.baseUrl}/api/v1/portfolios/${encodeURIComponent(portfolioname)}/bulk_holdings`,
        auth: {
          user: Credentials.userid,
          password: Credentials.password,
        },
        json: true,
        body: defaultHoldings
      };
      console.log('No holding found. Injecting default...', defaultHoldings);
      return request(postHoldingsRequest);
    })
    // wait for the result
    .then((result) => {
      console.log('Created default holdings', result);
    })
    // and query the holdings again
    .then(() => request(getHoldingsRequest).then((result) => {
      res.send(result);
    }))
    //
    .catch((err) => {
      if (err && err.message === 'processed') {
        return;
      }

      console.log(err);
      res.status(500).send({ ok: false });
    });
});

function currentISOTimestamp() {
  return new Date().toISOString();
}

module.exports = (portfolioCredentials) => {
  Credentials = portfolioCredentials;
  return router;
};
