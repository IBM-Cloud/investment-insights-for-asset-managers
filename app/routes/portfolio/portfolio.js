(function(){
  var app = angular.module('app');

  app.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('portfolio', {
      url: '/portfolio',
      templateUrl: 'routes/portfolio/portfolio.html',
      controller: 'PortfolioController as controller'
    });
  });

  app.controller('PortfolioController', ['$scope', '$state', '$stateParams', 'PortfolioService', 'StateService',
    function($scope, $state, $stateParams, PortfolioService, StateService) {
      console.log('PortfolioController()');

      $scope.selectedHoldings = [];
      $scope.portfolios = StateService.get('portfolios');
      $scope.selectedPortfolio = StateService.get('portfolios.selected');

      $scope.selectPortfolio = function(portfolio) {
        if (portfolio === $scope.selectedPortfolio) {
          return;
        }
        console.log('Selecting', portfolio.name);
        $scope.selectedPortfolio = portfolio;
        StateService.set('portfolios.selected', portfolio);

        // load holdings if there were never loaded
        if (!portfolio.holdings) {
          PortfolioService.getHoldings(portfolio).then(function(holdings) {
            console.log('Found', holdings);
            portfolio.holdings = holdings;
          });
        }
      };

      if (!$scope.portfolios) {
        PortfolioService.getPortfolios().then(function(portfolios) {
          console.log('Found', portfolios);
          $scope.portfolios = portfolios;
          if (portfolios.length > 0) {
            $scope.selectPortfolio(portfolios[0]);
          }
          StateService.set('portfolios', portfolios);
        });
      } else if ($scope.selectedPortfolio) {
        $scope.selectedPortfolioIndex =
          $scope.portfolios.findIndex(function(item) {
            return item.name === $scope.selectedPortfolio.name;
          });
        $scope.selectPortfolio($scope.portfolios[$scope.selectedPortfolioIndex]);
      }
    }]);
})();
