(function () {
  angular.module('app')
    .service('SimulationService', ['$http', '$q', SimulationService]);

  function SimulationService($http, $q) {
    console.log('SimulationService loading...');
    var values = { };
    return {
      simulate: function(instrumentIds, riskFactor, shockValue) {
        var deferred = $q.defer();
        $http.post('/api/v1/simulation', {
          instrumentIds: instrumentIds,
          riskFactor: riskFactor,
          shockValue: shockValue,
        }).then(function(response) {
          deferred.resolve(response.data);
        }).catch(function(err) {
          console.log(err);
          deferred.reject(err);
        });
        return deferred.promise;
      }
    };
  }

})();
