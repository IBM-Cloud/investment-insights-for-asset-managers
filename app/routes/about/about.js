(function(){
  var app = angular.module('app');

  app.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('dashboard.about', {
      url: '/about',
      templateUrl: 'routes/about/about.html'
    });
  });

})();
