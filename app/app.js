(function () {

    'use strict';

    angular
        .module('app', ['auth0.auth0', 'ui.router', 'ngMaterial', 'ngAnimate'])
        .config(config);

    config.$inject = [
        '$stateProvider',
        '$locationProvider',
        '$urlRouterProvider',
        'angularAuth0Provider'
    ];

    function config(
        $stateProvider,
        $locationProvider,
        $urlRouterProvider,
        angularAuth0Provider
    ) {

        $stateProvider
            .state('home', {
                url: '/',
                controller: 'HomeController',
                templateUrl: '/home/home.html',
                controllerAs: 'vm'
            })
            .state('callback', {
                url: '/app/callback',
                controller: 'CallbackController',
                templateUrl: '/callback/callback.html',
                controllerAs: 'vm'
            })
            .state('guest',{
                url: '/guest',
                controller: 'HomeController',
                templateUrl: '/home/home.html',
                controllerAs: 'vm'
            });

        // Initialization for the angular-auth0 library
        angularAuth0Provider.init({
            clientID: AUTH0_CLIENT_ID,
            domain: AUTH0_DOMAIN,
            responseType: 'token id_token',
            audience: 'https://' + AUTH0_DOMAIN + '/userinfo',
            // redirectUri: AUTH0_CALLBACK_URL,
            redirectUri: location.href + 'app/callback',
            scope: 'openid',
            prompt: 'none'
        });

        // console.log($urlRouterProvider);

        //$urlRouterProvider.otherwise('/');

        $locationProvider.hashPrefix('');

        /// Comment out the line below to run the app
        // without HTML5 mode (will use hashes in routes)
        $locationProvider.html5Mode(true);
    }

})();
