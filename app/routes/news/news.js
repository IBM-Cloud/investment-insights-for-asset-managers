(function(){
  var app = angular.module('app');

  app.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('news', {
      url: '/news',
      templateUrl: 'routes/news/news.html',
      controller: 'NewsController as controller'
    });
  });

  var horizons = [
    { display: '24 hours', days: -1 },
    { display: '48 hours', days: -2 },
    { display: '7 days', days: -7 },
    { display: '28 days', days: -28 },
  ];

  app.controller('NewsController', ['$scope', '$state', '$stateParams', 'PortfolioService', 'NewsService', 'StateService',
    function($scope, $state, $stateParams, PortfolioService, NewsService, StateService) {
      $scope.availableRiskFactors = PortfolioService.getRiskFactors();
      $scope.horizons = horizons;

      $scope.selectHorizon = function(horizon) {
        $scope.selectedHorizon = horizon;
      };

      $scope.findArticles = function() {
        NewsService.findArticles($scope.selectedRiskFactor, $scope.selectedHorizon)
          .then(function(articles) {
            console.log('Found', articles);
            $scope.articles = articles;

            StateService.set('news.riskFactor', $scope.selectedRiskFactor);
            StateService.set('news.horizon', $scope.selectedHorizon);
            StateService.set('news.shockValue', articles.shockValue);
            StateService.set('news', articles);
          });
      };

      // restore view data
      $scope.articles = StateService.get('news');
      $scope.selectedRiskFactor = StateService.get('news.riskFactor') || $scope.availableRiskFactors[0];
      $scope.selectedHorizon = StateService.get('news.horizon') || $scope.horizons[0];
    }]);

})();
