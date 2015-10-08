angular.module('app', ['app.controllers', 'app.services','ui.router', 'app.url'])
  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('landing', {
        params: {roomError: false},
        templateUrl: 'landing.html',
        url: '/',
        controller: 'LandingController'
      })
      .state('create', {
        url: '/create',
        templateUrl: 'create.html',
        controller: 'CreateController'
      })
      .state('event', {
        url: '/events/:event',
        templateUrl: 'event.html',
        controller: 'EventController'
      })
      .state('event.playlist', {
        templateUrl: 'event.playlist.html',
        controller: 'EventController'
      })
      .state('event.search', {
        url: '/search',
        templateUrl: 'event.search.html',
        controller: 'SearchController'
      });

      $urlRouterProvider.otherwise('/');
  });



