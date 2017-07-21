(function () {
    angular
        .module('app')
        .controller('HomeController', homeController)
        .filter('titleCase', function() {
         return function(input) {
      input = input || '';
      return input.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };
    });

    function homeController($scope, authService, $http, $location) {
        var vm = this;
        vm.auth = authService;
        vm.login = login;
        $scope.oneAtATime = true;
        var mapping = [
            {name: 'technology', file: '/data/technology_holdings.json'},
            { name: 'pharmaceutical',file: '/data/pharma_holdings.json'},
            { name: 'agriculture',file: '/data/agriculture_holdings.json'}
            ];

        var holdingsArray = [];
        var count = 0;
        // login function making a call to signin that comes from auth service and send the user profile to the profile that user is logged in with. If all good the storing user profile on local storage.
        function login() {
            //profile will hold user profile info and the token will get us the jwt
            auth.signin({}, function (profile, token) {
                store.set('profile', profile);
                store.set('id_token', token);
                $location.path('/test'); // user is sent to home page
            }, function (error) {
                console.log(error);
            });
        }

        // portfolio function
        vm.initialSetup = function () {
            //Reading Portfolios JSON
            $http({
                method: 'GET',
                url: '/data/portfolios.json'
            }).then(function (result) {
                $scope.portfolios = result.data.portfolios;

                if (result !== null && (result.data !== null || result.data !== '')) {
                    //console.log(replaceAll(JSON.stringify(result.data),"currentdate",currentISOTimestamp()));
                    //Creating Porfolios
                    $http({
                        method: 'POST',
                        url: '/api/bulkportfolios',
                        data: replaceAll(JSON.stringify(result.data), "currentdate", currentISOTimestamp())
                    })
                        .then(function (response) {
                            //Reading Holdings JSON one at a time.
                            angular.forEach(mapping, function (value, key) {
                                    $http({
                                        method: 'GET',
                                        url: value.file
                                    }).then(function (holdings) {
                                            //console.log("HOLDINGS JSON:" + holdings.data);
                                            //Creating Holdings and mapping them to respective portfolio
                                            $http({
                                                method: 'POST',
                                                url: '/api/holdings/' + value.name,
                                                data: holdings.data
                                            }).then(function (holdingsresult) {
                                                    //console.log("HOLDINGS CREATION result:" + holdingsresult.data);
                                                }, function (err) {
                                                    console.log("CREATE HOLDINGS FAILED", err);
                                                });
                                            holdingsArray.push(holdings.data.holdings);
                                        }, function (err) {
                                        console.log(err);
                                    });
                                }
                            );
                            $scope.holdings = holdingsArray;
                            //console.log("HOLDINGS ARRAY:" + holdingsArray);
                        }, function (err) {
                            console.log("CREATE PORTFOLIOS FAILED", err);
                        });
                }
                //return replaceAll(JSON.stringify(result.data),"currentdate",currentISOTimestamp());
            }, function (err) {
                console.log(err);
            });
        };

        // Holdings Function
        vm.getHoldings = function (portfolio) {
            $scope.holdings = "";
            $scope.loading = true;
            switch (portfolio.name) {
                case 'technology':
                    //alert("technology");
                    returnHoldings("technology");
                    break;
                case 'pharmaceutical': {
                    //alert("pharmaceutical");
                    returnHoldings("pharmaceutical");
                    break;
                }
                case 'agriculture':{
                    returnHoldings("agriculture");
                    break;
                }
            }
        };

        function returnHoldings(portfolioname){
            $http({
                method: 'GET',
                url: '/api/holdings/'+ portfolioname
            }).then(function(holdings){
                $scope.holdings = holdings.data.holdings[0].holdings;
                $scope.loading = false;
            });
        }
        function currentISOTimestamp() {
            return new Date().toISOString();
        }

        function replaceAll(str, find, replace) {
            //console.log("REPLACE CALLED");
            return str.replace(new RegExp(find, 'g'), replace);
        }


        // Alert when company selected
        vm.toDiscovery = function(companyname){
            console.log(companyname)
        };

        // Discovery News function
        vm.discoveryNews = function () {
            $http({
                method: 'GET',
                url: '/api/news'
            }).then(function (result) {
                $scope.newslist = result.data;
                console.log(result);
            }, function (err) {
                console.log(err);
            });
        };

        $scope.discoveryNewsButton = function() {
            window.location = "./api/news";
        };
        $scope.portfolioButton = function() {
            window.location = "./api/portfolios";
        };

    }

  /*vm.toDiscovery = function(companyname)
  {
      //alert(companyname);
  }*/


    homeController.$inject = ['$scope', 'authService', '$http'];
})();
