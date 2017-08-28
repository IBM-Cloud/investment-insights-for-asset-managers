(function () {
  angular.module('app')
    .service('LoginService', ['$http', '$q', 'StateService', LoginService]);

  function LoginService($http, $q, StateService) {
    console.log('LoginService loading...');
    var lastResponse;
    return {
      isLogged: function() {
        if (lastResponse && lastResponse.logged) {
          console.debug('Reusing last response');
          return $q.resolve(lastResponse);
        }

        var deferred = $q.defer();
        $http.get('/auth/logged').then(function(response) {
          // stop calling the API once we know we are logged
          if (response.data.logged) {
            lastResponse = response.data;
            StateService.set('logged', lastResponse);
          } else {
            StateService.unset('logged');
          }
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
