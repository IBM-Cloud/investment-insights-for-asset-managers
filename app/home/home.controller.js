(function () {
    angular
        .module('app')
        .controller('HomeController', homeController)
        .filter('titleCase', function () {
            return function (input) {
                input = input || '';
                return input.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
            };
        });

    function homeController($scope, authService, $http, $location) {
        var vm = this;
        vm.auth = authService;
        vm.login = login;
        $scope.oneAtATime = true;
        var mapping = [
            { name: 'technology', file: '/data/investmentPortfolio/holdings/technology_holdings.json' },
            { name: 'oil', file: '/data/investmentPortfolio/holdings/oil_holdings.json' },
            { name: 'mining', file: '/data/investmentPortfolio/holdings/mining_holdings.json' }
        ];
        //$scope.selected = { id: 14, name: 'Gold Price' };
        $scope.riskfactors = [
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

        vm.initialSetup = function () {
            //Reading Portfolios JSON
            $http({
                method: 'GET',
                url: '/data/investmentPortfolio/portfolio/portfolios.json'
            }).then(function (result) {
                $scope.portfolios = result.data.portfolios;

                if (result !== null && (result.data !== null || result.data !== '')) {
                    //console.log(replaceAll(JSON.stringify(result.data),"currentdate",currentISOTimestamp()));
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
                case 'oil': {
                    //alert("pharmaceutical");
                    returnHoldings("oil");
                    break;
                }
                case 'mining': {
                    returnHoldings("mining");
                    break;
                }
            }

        };

        function returnHoldings(portfolioname) {
            $http({
                method: 'GET',
                url: '/api/holdings/' + portfolioname
            }).then(function (holdings) {
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
        $scope.showMessage = true;
        $scope.simulateShock = true;

        var goldP = 'price of gold, gold forecast'; // temp hard code
        //When user selected a portfolio
        vm.toDiscovery = function () {
            $scope.loading = true;
            //$scope.holding = holding;
            //console.log("SEARCH:" + $scope.selectedRiskFactor.search);
            $scope.currentprice = "";
            $scope.stressedprice = "";
            $scope.difference = "";
            $scope.simulateheading = false;
            //console.log($scope.holding);
            $http({
                method: 'POST',
                url: '/api/news/' + $scope.selectedRiskFactor.search,
                data: { company: $scope.selectedRiskFactor.search }
            }).then(function (result) {
                if (result.config.data.company !== undefined) {
                    $scope.newslist = result.data;
                    $scope.showMessage = false;

                    // Total docSentiment (negative, positive and neutral)
                    var negativeCount = 0;
                    var positiveCount = 0;
                    var neutralCount = 0;
                    var totalPositiveCount_NegativeCount = 0;
                    var shockvalue = 0;
                    var shockType;
                    angular.forEach(result.data.results, function (item) {

                        //console.log(item.host);
                        // if (item.host == "www.military.com" || item.host == "www.gamezone.com") {
                        //     console.log('Found');
                        //      return
                        // }

                        // Adding counter to negative, positive, neutral values for $scope
                        if (item.docSentiment.type == 'negative') {
                            negativeCount++;
                        }
                        if (item.docSentiment.type == 'positive') {
                            positiveCount++;
                        }
                        if (item.docSentiment.type == 'neutral') {
                            neutralCount++;
                        }

                        // Check if negative sentiments are > then positive sentiments and set shockType values to fall or rise
                        if(negativeCount >= positiveCount){
                            totalPositiveCount_NegativeCount = negativeCount - positiveCount;
                            $scope.shockType = 'fall';
                        }else{
                            totalPositiveCount_NegativeCount =  positiveCount - negativeCount;
                            $scope.shockType = 'rise';
                        }
                        //console.log(totalPositiveCount_NegativeCount + ' by ' + shockType);

                        // Setting shock values
                        if (totalPositiveCount_NegativeCount >= 1 && totalPositiveCount_NegativeCount <= 3) {
                            $scope.shockvalue = 0.7;
                        }
                        if (totalPositiveCount_NegativeCount >= 4 && totalPositiveCount_NegativeCount <= 6) {
                            $scope.shockvalue = 0.9;
                        }
                        if(totalPositiveCount_NegativeCount >= 7 && totalPositiveCount_NegativeCount <= 10){
                            $scope.shockvalue = 1.1; 
                        }
                        if (totalPositiveCount_NegativeCount > 10) {
                            $scope.shockvalue = 1.3;
                        }

                    });
                    $scope.csv_link = './data/predictiveMarketScenarios/predictivescenarios' + ($scope.shockvalue * 10) + '.csv';
                    $scope.negativeCount = negativeCount;
                    $scope.positiveCount = positiveCount;
                    $scope.neutralCount = neutralCount;
                    $scope.loading = false;

                } else {
                    //console.log('Please select a portfolio company');
                    $scope.showMessage = true;
                }
            }, function (err) {
                console.log(err);
            });
        };

        vm.simulate = function () {
            $scope.loading = true;
            $scope.simulateShock = false;
            var instrumentslist = [];
            angular.forEach($scope.holdings, function (value, key) {
                instrumentslist.push(value.instrumentId);
            });
            //angular.forEach($scope.holdings, function)
            //var data =[{"instrument":"CX_US037833CM07_USD","scenario":"Base Scenario (0.0000)","values":[{"THEO/Price":"100.2544 USD","date":"2017/07/26"}]},{"instrument":"CX_US037833CM07_USD","scenario":"CONDITIONAL_1 (1.0000)","values":[{"THEO/Price":"100.2314 USD","date":"2017/07/26"}]}];

            //console.log(instrumentid);
            //alert($scope.holding.instrumentId);
            //console.log($scope.holding.instrumentId);
            $http({
                method: 'POST',
                url: '/api/instruments/' + $scope.holding + '/' + $scope.shockvalue,
                data: { instrumentslist }
            }).then(function (instruments) {
                //console.log(JSON.stringify(instruments));
                //var valuesArray = [];
                var dict = {};
                angular.forEach(instruments.data, function (value, key) {
                    var keyName = value.instrument + value.scenario;
                    angular.forEach(value.values, function (v, k) {
                        dict[keyName] = v["THEO/Price"];
                    });
                });
                //console.log(dict);
                var portfolioSimulationArray = [];
                angular.forEach($scope.holdings, function (value, key) {
                    var currentPrice_value = value.instrumentId + "Base Scenario (0.0000)";
                    var stressedPrice_value = value.instrumentId + "CONDITIONAL_1 (1.0000)";
                    var difference = (((parseFloat(dict[stressedPrice_value]) / parseFloat(dict[currentPrice_value]))-1)*100).toFixed(3);
                    portfolioSimulationArray.push({
                        name: value.asset,
                        company: value.companyName,
                        currentprice: dict[currentPrice_value],
                        stressedprice: dict[stressedPrice_value],
                        quantity: value.quantity,
                        pl: difference
                    }
                    );
                });
                $scope.portfoliosimulation = portfolioSimulationArray;
                //CP - Current Price ; SP - Stressed Price; pl - Profile Loss
                var totalCP = 0.0,totalSP = 0.0,totalPL = 0.0;
                angular.forEach(portfolioSimulationArray, function(value,key){
                        totalCP = totalCP + (parseFloat(value.currentprice) * value.quantity);
                        totalSP = totalSP + (parseFloat(value.stressedprice) * value.quantity);
                        totalPL = totalPL + parseFloat(value.pl);

                });
                $scope.totalcp = parseFloat(totalCP).toFixed(3);
                $scope.totalsp = parseFloat(totalSP).toFixed(3);
                $scope.totalpl = (((parseFloat(totalSP)/parseFloat(totalCP))-1)*100).toFixed(3);
                //console.log(totalPL);
                //console.log(portfolioSimulationArray.length);
                //console.log($scope.totalpl);
                $scope.loading = false;
                $scope.simulateheading = true;
                //$scope.$apply();

            });

        }

        $scope.riskfactorChanged = function (selectedValue) {
            //alert(selectedValue.id);
            $scope.selectedRiskFactor = selectedValue;
        }

        $scope.dateAndTime = function (_date) {
            //console.log("date: ", _date);

            //console.log(parseInt(_date));
            return parseInt(_date);
        }

        $scope.discoveryNewsButton = function () {
            window.location = "./api/news";
        };
        $scope.portfolioButton = function () {
            window.location = "./api/portfolios";
        };


    }

    homeController.$inject = ['$scope', 'authService', '$http'];
})();
