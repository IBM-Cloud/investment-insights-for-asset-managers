(function(){
  var app = angular.module('app');

  app.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('about', {
      url: '/about',
      templateUrl: 'routes/about/about.html',
      css: 'routes/about/about.css'
    });
  });

})();
