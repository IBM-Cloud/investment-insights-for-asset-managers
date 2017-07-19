(function () {

  'use strict';

  angular
    .module('app')
    .controller('HomeController', homeController);


  function homeController($scope, authService, $http, $location) {
    var vm = this;
    vm.auth = authService;
    vm.login = login;
    $scope.oneAtATime = true;
    // login function making a call to signin that comes from auth service and send the user profile to the profile that user is logged in with. If all good the storing user profile on local storage.
    function login() {
        //profile will hold user profile info and the token will get us the jwt
        auth.signin({}, function (profile, token) {
            store.set('profile', profile);
            store.set('id_token', token);
            $location.path('/test'); // user is sent to home page
        }, function (error){
            console.log(error);
        });
    }


// porfolio function
   vm.initialSetup = function ()
    {
     $http({
        method: 'GET',
        url: '/data/portfolios.json'
     }).then(function(result){
         $scope.portfolios = result.data.portfolios;
         
        if(result !== null && (result.data !== null || result.data !== ''))
            {
                //console.log(replaceAll(JSON.stringify(result.data),"currentdate",currentISOTimestamp()));
                $http({
                    method: 'POST',
                    url: '/api/bulkportfolios',
                    data: replaceAll(JSON.stringify(result.data),"currentdate",currentISOTimestamp())
                    })
                        .then(function(response) {
                           
                        }, function(err) {
                            //Error handling
                        });
                        }
        
         //return replaceAll(JSON.stringify(result.data),"currentdate",currentISOTimestamp());
     },function(err){

     });
      
    }
    function listPortfolios()
    {
      $http({
             method: 'GET',
             url: '/api/portfolios', 
            })
            .then(function(response) {
                console.log("RESULT:"+ response);
            }, function(err) {
                //Error handling
            });
    }
  
  }

function currentISOTimestamp(){
    return new Date().toISOString();
}
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}
  homeController.$inject = ['$scope', 'authService', '$http'];

})();
