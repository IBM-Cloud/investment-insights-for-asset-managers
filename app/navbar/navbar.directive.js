(function() {
  
  'use strict';
  
  angular
    .module('app')
    .directive('navbar', navbar);
    
  function navbar() {
    return {
      templateUrl: 'app/navbar/navbar.html',
      controller: navbarController,
      controllerAs: 'vm'
    }
  }

  navbarController.$inject = ['authService'];
    
  function navbarController(authService) {
    var vm = this;
    vm.auth = authService;
  }
  
})();