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
            {name: 'technology', file: '/data/investmentPortfolio/holdings/technology_holdings.json'},
            { name: 'pharmaceutical',file: '/data/investmentPortfolio/holdings/pharma_holdings.json'},
            { name: 'agriculture',file: '/data/investmentPortfolio/holdings/agriculture_holdings.json'}
            ];

        //var holdingsArray = [];

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
                url: '/data/investmentPortfolio/portfolio/portfolios.json'
            }).then(function (result) {
                $scope.portfolios = result.data.portfolios;

                if (result !== null && (result.data !== null || result.data !== '')) {
                    //console.log(replaceAll(JSON.stringify(result.data),"currentdate",currentISOTimestamp()));
                    //Creating Porfolios
                    $http({
                        method: 'POST',
                        url: '/api/bulkportfolios',
                        data: replaceAll(JSON.stringify(result.data), "currentdate", currentISOTimestamp())
                    }).then(function (response) {
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
                                            //holdingsArray.push(holdings.data.holdings);
                                        }, function (err) {
                                        console.log(err);
                                    });
                                }
                            );
                            //$scope.holdings = holdingsArray;
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

        var showMessage;
        var dateAndTime;
        $scope.showMessage = true

        //When user selected a portfolio
        vm.toDiscovery = function(holding){
            $scope.holding = holding;
            $scope.currentprice = "";
            $scope.stressedprice = "";
            $scope.difference = "";
            $scope.simulateheading = false;
            //console.log($scope.holding);
            $http({
                method: 'POST',
                url: '/api/news/' + holding.companyName,
                data: {company: holding.companyName}
            }).then(function (result) {
                if(result.config.data.company !== undefined){
                    $scope.newslist = result.data;
                    $scope.showMessage = false;
                    
                    // Total docSentiment (negative, positive and neutral)
                    var negativeCount = 0;
                    var positiveCount = 0;
                    var neutralCount = 0;
                    var shockvalue = 0;

                    angular.forEach(result.data.results, function (item) {
                        if(item.docSentiment.type == 'negative'){
                            negativeCount++;

                            // Setting shock values
                            if(negativeCount >= 1 && negativeCount <= 3){
                                $scope.shockvalue = 0.5; 
                            }
                            if(negativeCount >= 4 && negativeCount <= 6){
                                $scope.shockvalue = 1.5; 
                                console.log($scope.shockvalue);
                            }
                            if(negativeCount >= 7 && negativeCount <= 10){
                                $scope.shockvalue = 2.5; 
                            }
                            if(negativeCount >= 10 && negativeCount <= 20){
                                $scope.shockvalue = 3.5; 
                            }
                            if(negativeCount > 21){
                                $scope.shockvalue = 5.5; 
                            }
                        }
                        if(item.docSentiment.type == 'positive'){
                            positiveCount++;
                        }
                        if(item.docSentiment.type == 'neutral'){
                            neutralCount++;
                        }                        
                    });
                    $scope.csv_link = './data/predictiveMarketScenarios/predictivescenarios'+ ($scope.shockvalue*10) +'.csv';
                    $scope.negativeCount = negativeCount;
                    $scope.positiveCount = positiveCount;
                    $scope.neutralCount = neutralCount;

                }else {
                    //console.log('Please select a portfolio company');
                    $scope.showMessage = true;
                }
            }, function (err) {
                console.log(err);
            });
        };

        vm.simulate = function(instrumentid)
        {
             $scope.loading = true;
           //var data =[{"instrument":"CX_US037833CM07_USD","scenario":"Base Scenario (0.0000)","values":[{"THEO/Price":"100.2544 USD","date":"2017/07/26"}]},{"instrument":"CX_US037833CM07_USD","scenario":"CONDITIONAL_1 (1.0000)","values":[{"THEO/Price":"100.2314 USD","date":"2017/07/26"}]}];
          
            //console.log(instrumentid);
            //alert($scope.holding.instrumentId);
            //console.log($scope.holding.instrumentId);
         $http({
                method: 'POST',
                url: '/api/instruments/'+$scope.holding.instrumentId+'/'+$scope.shockvalue
            }).then(function(instruments){
           // console.log(JSON.stringify(instruments));
            var valuesArray = [];
           angular.forEach(instruments.data,function(value, key) {
               angular.forEach(value.values, function(v,k){
                     valuesArray.push(v["THEO/Price"]);
               });
           });
           //console.log(valuesArray[0]);
           var difference = parseFloat(valuesArray[1]) - parseFloat(valuesArray[0]);
           $scope.currentprice = valuesArray[0];
           $scope.stressedprice = valuesArray[1];
           $scope.difference = difference.toFixed(3);
           $scope.loading = false;
           $scope.simulateheading = true;
           //$scope.$apply();
          
            });
           
        }

        $scope.dateAndTime = function(_date) { 
            //console.log("date: ", _date);

            //console.log(parseInt(_date));
            return parseInt(_date); 
        }

        $scope.discoveryNewsButton = function() {
            window.location = "./api/news";
        };
        $scope.portfolioButton = function() {
            window.location = "./api/portfolios";
        };


    }

    homeController.$inject = ['$scope', 'authService', '$http'];
})();
