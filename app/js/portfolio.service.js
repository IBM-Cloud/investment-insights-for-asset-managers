(function () {
  angular.module('app')
    .service('PortfolioService', ['$http', '$q', PortfolioService]);

  function PortfolioService($http, $q) {
    console.log('PortfolioService loading...');
    var self = this;
    var riskFactors = [
      { id: "CX_EQI_SPDJ_USA500_BMK_USD_LargeCap_Price", name: "S&P 500", search: "S&P 500" },
      { id: "CX_COS_ME_Gold_XCEC", name: "Gold Price", search: "price of gold, gold forecast" },
      { id: "CX_COS_EN_BrentCrude_IFEU", name: "Brent Crude Oil", search:"spot price brent oil" },
      { id: "CX_COS_EN_WTICrude_IFEU", name: "WTI Crude Oil", search:"spot price of WTI Crude Oil" },
      { id: "CX_FXC_EUR_USD_Spot", name: "Eur/USD", search: "EUR USD FX rate" },
      { id: "CX_EQI_NASD_USAComposite_BMK_USD_LargeCap_Price", name: "NASDAQ Composite Index", search: "NASDAQ Composite index" },
      { id: "CX_EQI_NYSE_CAC40_BMK_EUR_LargeCap_Price", name: "CAC 40 Index",search:"CAC 40 Index"  },
      { id: "CX_EQI_NYSE_USA_BMK_USD_LargeCap_Price", name: "NYSE MKT Composite Index",search:"NYSE MKT Composite Index" },
      { id: "CX_EQI_NIKK_Asia_BMK_JPY_LargeCap_Price", name: "Nikkei 225 Index",search:"Nikkei 225 Index" },
      { id: "CX_EQI_HSNG_Asia_BMK_HKD_LargeCap_Price", name: "Hang Seng Index",search:"Hang Seng Index" },
      { id: "CX_EQI_FTSE_UK_BMK_GBP_LargeCap_Price", name: "FTSE 100 Index" },
      { id: "CX_FXC_JPY_USD_Spot", name: "JPY/USD",search:"JPY USD FX rate" },
      { id: "CX_FXC_CAD_USD_Spot", name: "CAD/USD",search:"CAD USD FX rate" },
      { id: "CX_FXC_GBP_USD_Spot", name: "GBP/USD",search:"GBP USD FX rate" }
    ];
    return {
      getPortfolios: function() {
        var deferred = $q.defer();
        $http.get('/api/v1/portfolios').then(function(response) {
          console.log('Raw response', response);
          deferred.resolve(response.data.portfolios);
        }).catch(function(err) {
          console.log(err);
          deferred.reject(err);
        });
        return deferred.promise;
      },
      getHoldings: function(portfolio) {
        var deferred = $q.defer();
        $http.get(`/api/v1/portfolios/${encodeURIComponent(portfolio.name)}/holdings`).then(function(response) {
          console.log('Raw response', response);
          deferred.resolve(response.data.holdings[0].holdings);
        }).catch(function(err) {
          console.log(err);
          deferred.reject(err);
        });
        return deferred.promise;
      },
      getRiskFactors: function() {
        return riskFactors;
      }
    };
  }

})();
