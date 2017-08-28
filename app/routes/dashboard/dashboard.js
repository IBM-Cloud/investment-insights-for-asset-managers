(function(){
  var app = angular.module('app');

  app.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('dashboard', {
      url: '/dashboard',
      templateUrl: 'routes/dashboard/dashboard.html'
    });
  });
})();
