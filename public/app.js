var app = angular.module('Catbird', ['ui.router', 'IndexCtrl', 'SettingsCtrl', 'AssetsCtrl', 'EventsCtrl', 'CompareCtrl', 'TopologyCtrl', 'LoginCtrl']);

app.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'login/index.html',
            controller: 'LoginCtrl'
        })

        .state('index', {
            url: '/',
            templateUrl: 'home/index.html',
            controller: 'IndexCtrl'
        })

        .state('topology', {
            url: '/topology',
            templateUrl: 'topology/index.html',
            controller: 'TopologyCtrl'
        })

        .state('settings', {
            url: '/settings',
            templateUrl: 'settings/index.html',
            controller: 'SettingsCtrl'
        })

        .state('assets', {
            url: '/assets',
            templateUrl: 'assets/index.html',
            controller: 'AssetsCtrl'
        })

        .state('events', {
            url: '/events',
            templateUrl: 'events/index.html',
            controller: 'EventsCtrl'
        })

        .state('compare', {
            url: '/compare',
            templateUrl: 'compare/index.html',
            controller: 'CompareCtrl'
        })

        /*.state('test', {
            url: '/test',
            templateUrl: 'topology-test/topology/index.html',
            controller: 'TestTopologyCtrl'
        })*/
})