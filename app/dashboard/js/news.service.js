(function () {
  angular.module('app')
    .service('NewsService', ['$http', '$q', NewsService]);

  function NewsService($http, $q) {
    console.log('NewsService loading...');
    var self = this;
    return {
      findArticles: function(riskFactor, horizon) {
        console.log('Looking for', riskFactor, horizon);
        var deferred = $q.defer();
        $http.post(`/api/v1/news/${encodeURIComponent(riskFactor.search)}`,
          {
            company: riskFactor.search,
            daysDate: horizon.days
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
