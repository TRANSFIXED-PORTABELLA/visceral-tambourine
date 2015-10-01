angular.module('app', ['app.controllers', 'app.services','ngRoute'])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'landing.html',
        controller: 'LandingController'
      })
      .when('/create', {
        templateUrl: 'create.html',
        controller: 'CreateController'
      })
      .when('/events/:event', {
        templateUrl: 'event.html',
        controller: 'EventController'
      })
      .when('/events/:event/search', {
        templateUrl: 'search.html',
        controller: 'SearchController'
      });
  });

