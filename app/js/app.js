/*global angular*/
(function () {

  // listen for request sent over XHR and automatically show/hide spinner
  angular.module('ngLoadingSpinner', [])
    .directive('spinner', ['$http', function ($http) {
      return {
        link: function (scope, elm, attrs) {
          scope.isLoading = function () {
            return $http.pendingRequests.length > 0;
          };
          scope.$watch(scope.isLoading, function (loading) {
            if (loading) {
              document.getElementById('loadingProgress').style.visibility = "visible";
            } else {
              document.getElementById('loadingProgress').style.visibility = "hidden";
            }
          });
        }
      };
    }]);

  // angular app initialization
  var app = angular.module('app', [
    'ngMaterial',
    'ngLoadingSpinner',
    'ui.router',
    'md.data.table',
  ]);

  app.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('deep-orange')
      .accentPalette('orange');
  });

  app.directive('prism', ['$compile', function($compile) {
    return {
      restrict: 'A',
      transclude: true,
      scope: {
        source: '@'
      },
      link: function(scope, element, attrs, controller, transclude) {
        scope.$watch('source', function(v) {
          element.find('code').html(v);
          Prism.highlightElement(element.find('code')[0]);
        });

        transclude(function(clone) {
          if (clone.html() !== undefined) {
            element.find("code").html(clone.html());
            $compile(element.contents())(scope.$parent);
          }
        });
      },
      template: '<code></code>'
    };
  }]);

  app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/about');
  });

  app.controller('AppController', ['$scope', '$mdDialog', 'StateService',
    function($scope, $mdDialog, StateService) {
      console.log('AppController()');

      $scope.state = StateService;
      $scope.sidebarVisible = true;

      $scope.toggleSidebar = function() {
        $scope.sidebarVisible = !$scope.sidebarVisible;
      }

      $scope.viewJSON = function(ev, targetObject) {
        $mdDialog.show({
          controller: DialogController,
          templateUrl: 'templates/viewJSON.tmpl.html',
          parent: angular.element(document.body),
          clickOutsideToClose:true,
          targetEvent: ev,
          fullscreen: true,
          locals: { source: targetObject }
        });
      }

      function DialogController($scope, $mdDialog, source) {
        $scope.source = source;
        $scope.hide = function() {
          $mdDialog.cancel();
        };
      }

    }]);

})();
