(function () {
  angular.module('app')
    .service('StateService', ['$http', '$q', StateService]);

  function StateService($http, $q) {
    console.log('StateService loading...');
    var values = { };
    return {
      set: function(key, value) {
        values[key] = value;
      },
      get: function(key) {
        return values[key];
      }
    };
  }

})();
