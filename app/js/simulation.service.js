(function () {
  angular.module('app')
    .service('SimulationService', ['$http', '$q', '$state', SimulationService]);

  function SimulationService($http, $q, $state) {
    console.log('SimulationService loading...');
    return {
      simulate: function(instrumentIds, riskFactor, shockValue) {
        var deferred = $q.defer();
        $http.post('/api/v1/simulation', {
          instrumentIds: instrumentIds,
          riskFactor: riskFactor,
          shockValue: shockValue
        }).then(function(response) {
          deferred.resolve(response.data);
        }).catch(function(err) {
          console.log(err);
          if (err.status === 401) { $state.go('home'); }
          deferred.reject(err);
        });
        return deferred.promise;
      }
    };
  }
})();
