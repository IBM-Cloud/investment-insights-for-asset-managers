(function () {

  'use strict';

  angular
    .module('app')
    .controller('HomeController', homeController);

  function homeController($scope, authService, $location) {
    var vm = this;
    vm.auth = authService;
    vm.login = login;

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
    function createPortfolio()
    {
      $http({
          method: 'POST',
          url: '/api/dashboard', 
          
            })
            .then(function(response) {
                //Success handling
            }, function(err) {
                //Error handling
            });
    }
    function listPortfolios()
    {
      $http({
             method: 'GET',
             url: '/api/dashboard', 
            })
            .then(function(response) {
                console.log("RESULT:"+ response);
            }, function(err) {
                //Error handling
            });
    }


  }
  homeController.$inject = ['$scope', 'authService'];

})();
