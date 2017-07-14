angular.module('fintradeApp', [])
  .controller('fintradeController', function($scope,$http) {
    var dashboard = this;
    dashboard.Portfolio = function() {
        $http({
                method: 'POST',
                url: '/', 
                data: {
                    porfolioname : dashboard.porfolioname,
                }
            })
            .then(function(response) {
                //Success handling
            }, function(err) {
                //Error handling
            });
    dashboard.porfolioname = "";
    };
  });