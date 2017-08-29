var express = require('express');

var router = express.Router();
var dateFormat = require('dateformat');

var Discovery;

router.post('/api/v1/news', (req, res) => {
  // Getting date from Angular radio buttons
  var getDay = req.body.daysDate;
  var newDate = Date.now('dd:mm:yyyy') + (getDay * 24 * 3600 * 1000); // days ago in milliseconds
  var filterDay = dateFormat(newDate, 'yyyy-mm-dd');

  Discovery.query({
    environment_id: 'system',
    collection_id: 'news',
    query: req.body.search,
    count: 20,
    return: 'score,url,host,text,publication_date,enriched_text.sentiment,title',
    aggregations: [''],
    filter: `publication_date > ${filterDay}`,
    sort: '-_sort'
  }, (err, response) => {
    if (err) {
      console.log(err);
      res.status(500).send({ ok: false });
    } else {
      // skip the loop for each news element where if host == gamezone and military
      var newResponse = [];
      response.results.forEach((item) => {
        if (item.host === 'www.military.com' ||
            item.host === 'www.gamezone.com' ||
            item.host === 'barrons.com') {
          return;
        }
        newResponse.push(item);
      });
      response.results = newResponse;

      response.counts = {
        positive: response.results.filter(article => article.enriched_text.sentiment.document.label === 'positive').length,
        negative: response.results.filter(article => article.enriched_text.sentiment.document.label === 'negative').length,
        neutral: response.results.filter(article => article.enriched_text.sentiment.document.label === 'neutral').length,
      };

      // Check if negative sentiments are > then positive sentiments and
      // set shockType values to fall or rise
      var totalPositiveCountNegativeCount = 0;
      var shockValue = 0; 

      if (response.counts.negative >= response.counts.positive) {
        totalPositiveCountNegativeCount = response.counts.negative - response.counts.positive;
        response.shockType = 'fall';

        // Setting shock values for negative value
        if (totalPositiveCountNegativeCount >= 1 && totalPositiveCountNegativeCount <= 3) {
          shockValue = 1 - 0.7 / 100;
        }
        if (totalPositiveCountNegativeCount >= 4 && totalPositiveCountNegativeCount <= 6) {
          shockValue = 1 - 0.9 / 100;
        }
        if (totalPositiveCountNegativeCount >= 7 && totalPositiveCountNegativeCount <= 10) {
          shockValue = 1 - 1.1 / 100;
        }
        if (totalPositiveCountNegativeCount > 10) {
          shockValue = 1 - 1.3 / 100;
        }
      } else {
        totalPositiveCountNegativeCount = response.counts.positive - response.counts.negative;
        response.shockType = 'rise';

        // Setting shock values for positive value
        if (totalPositiveCountNegativeCount >= 1 && totalPositiveCountNegativeCount <= 3) {
          shockValue = 0.7 / 100 + 1;
        }
        if (totalPositiveCountNegativeCount >= 4 && totalPositiveCountNegativeCount <= 6) {
          shockValue = 0.9 / 100 + 1;
        }
        if (totalPositiveCountNegativeCount >= 7 && totalPositiveCountNegativeCount <= 10) {
          shockValue = 1.1 / 100 + 1;
        }
        if (totalPositiveCountNegativeCount > 10) {
          shockValue = 1.3 / 100 + 1;
        }
      }

      response.shockValue = shockValue;
      //console.log("Shock Value: " + response.shockValue);

      res.send(response);
    }
  });
});

module.exports = (discovery) => {
  Discovery = discovery;
  return router;
};
