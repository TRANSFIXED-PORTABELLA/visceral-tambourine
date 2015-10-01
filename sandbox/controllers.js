  angular.module('app.controllers', [])
  .controller('LandingController', ['$scope', '$location', 'socket', 'Event',
    function ($scope, $location, socket, Event) {
      //function called when join button clicked
      $scope.join = function (event) {
        //send the event to the server
        socket.emit('join', event);
        //set the name of the event. Used for routing purposes
        Event.event = event;
        //move the insider into the event
        $location.path('/events/' + event);
      };
      //directs user to the create event page
      $scope.create = function () {
        $location.path('/create');
      };
  }])
  .controller('CreateController', ['$scope', '$location', 'socket', 'Event',
    function ($scope, $location, socket, Event) {
      //function called when the create button is pushed
      $scope.create = function (event) {
        //set the name of the event.
        Event.event = event;
        //send the event to the server so it can do creation things
        socket.emit('create', event);
        //redirect  to the event
        $location.path('/events/' + event);
      };
    }])
  .controller('EventController', ['$scope', '$location', 'socket', 'Event',
    function ($scope, $location, socket, Event) {
      //this is the array that gets ng-repeated in the view
      $scope.songs = [];

      //link to the search view
      $scope.search = function () {
        $location.path('/events/' + Event.event + '/search');
      };

      //let the server know that insider has arrived in the room.
      socket.emit('joined');

      //server responses to this with the eventState
      socket.on('joined', function (songs) {
        //add the songs from the server to the local array
        //we are getting an ng-repeate dups error here beacause
        //when the user comes back from the search page
        //this socket event is triggered, refreshing the local songs array
        //but the song has already been pushed when the the song added socket event
        //gets triggered just before. Still trying to figure this one out.
        //only happens when multiple people are in the event
        $scope.songs = songs;

      });

      //server get the song from the insider that added the song and
      //boadcasts it to everyone in the event. Here we get the song and
      //add it to our local array
      socket.on('songAdded', function (song) {
        $scope.songs.push(song);
      });
    }
  ])
  .controller('SearchController', ['$scope', '$location', 'socket', 'searchFactory', 'Event',
    function ($scope, $location, socket, searchFactory, Event) {
      //array of results we get back from the you tubes
      $scope.searchResults = [];

      //link back to event
      $scope.home = function () {
        $location.path('/events/' + Event.event);
      };

      //function called when insider hits the add button
      //defers work to the factory, just passes along the song obj.
      $scope.addSong = function (song) {
        searchFactory.addSong(song);
      };

      //defers the http call to the factory, then adds the songs to the
      //local array
      $scope.getSearchResults = function (searchTerm) {
        searchFactory.getSearchResults(searchTerm)
          .then(function(result) {
            result.items.forEach(function (song) {
              var songObj = {
                id: song.id.videoId,
                url: 'https://www.youtube.com/embed/' + song.id.videoId,
                title: song.snippet.title,
                thumbnail: song.snippet.thumbnails.medium.url
              };
              $scope.searchResults.push(songObj);
            });
          });
      };

      socket.on('songAdded', function (song) {
        console.log(song);
      });
    }
  ]);