(function () {
  angular.module('app')
    .service('LoginService', ['$http', '$q', LoginService]);

  function LoginService($http, $q) {
    console.log('LoginService loading...');
    var self = this;
    return {
      isLogged: function() {
        var deferred = $q.defer();
        $http.get('/auth/logged').then(function(response) {
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
