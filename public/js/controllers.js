angular.module('app.controllers', [])
  .controller('LandingController', ['$scope', 'socket', 'Event', '$state',
    function ($scope, socket, Event, $state) {
      console.log('in landing controller');
      //function called when join button clicked
      $scope.join = function (event) {
        $state.go('event', {event: event});
      };
      //directs user to the create event page
      $scope.create = function () {
        $state.go('create');
      };
    }
  ])
  .controller('CreateController', ['$scope', 'socket', 'Event', '$state',
    function ($scope, socket, Event, $state) {
      console.log('in create controller');
      //function called when the create button is pushed
      $scope.create = function (event) {
        //send the event to the server so it can do creation things
        socket.emit('create', event);
        socket.on('createable', function (createable) {
          if (createable) {
          //set the name of the event.
            Event.event = event;
            Event.creator = socket.id();
            //redirect  to the event
            $state.go('event', {event: event});
          } else {
            $scope.error = true;
          }
        });
      };
    }
  ])
  .controller('EventController', ['$window', '$scope', '$state', 'socket', 'Event', '$rootScope', '$stateParams',
    function ($window, $scope, $state, socket, Event, $rootScope, $stateParams) {
      console.log('in event controller');

      //this is the array that gets ng-repeated in the view
      $scope.songs = [];

      // this variable will let us hide the player from event insiders other than
      // the creator
      $scope.isCreator = socket.id() === Event.creator;

      // to keep track of which song is up
      $scope.songIndex = 0;

      //link to the search view
      $scope.search = function () {
        $state.go('event.search');
      };

      $scope.roomInvite = $state.href($state.current.name, $state.params, {
        absolute: true
      });

      $scope.shareEvent = function () {
        new Clipboard('.share');
      };

      $scope.upVote = function () {
        socket.emit('upVote', this.song.id);
      };

      socket.on('voted', function (song) {
        $scope.songs.forEach(function (item) {
          if (item.id === song.id) {
            item.votes = song.votes;
          }
        });
        // multiple socket calls means this is called too often. 
        //for efficiency it should be throttled.
        $scope.sortedSongs = $scope.songs.sort(function (a,b) {
          return b.votes - a.votes;
        });
      });

      console.log('url', $stateParams.event);
      socket.emit('join', $stateParams.event);

      //let the server know that insider has arrived in the room.
      socket.on('success', function (success) {
        if (success) {
          socket.emit('joined');
        } else {
          $state.go('landing');
        }
      });

      //server responses to this with the eventState
      socket.on('roomJoined', function (songs) {
        //add the songs from the server to the local array
        //making sure thats its empty before doing so
        if ($scope.songs.length === 0) {
          $scope.songs = songs || [];
        }

      });

      //server get the song from the insider that added the song and
      //boadcasts it to everyone in the event. Here we get the song and
      //add it to our local array
      socket.on('songAdded', function (song) {
        $scope.songs.push(song);
        $scope.sortedSongs = $scope.songs.sort(function (a,b) {
          return b.votes - a.votes;
        });
      });

      socket.on('songRemoved', function (song) {
        $scope.songs.forEach(function (item, index) {
            if (item.id === song.id) {
              $scope.songs.splice(index, 1);
            }
          });
      });

      $state.go('event.playlist');

      // fired when the youtube iframe api is ready

      $window.onPlayerReady = function onPlayerReady(event) {
        console.log("ready");
        if ($scope.songs[0] && socket.id() === Event.creator) {
          player.cueVideoById($scope.songs[0].id);
          event.target.playVideo();
          socket.emit('removeSong', $scope.songs[0].id);
        } else {
          console.log('destroy player');
          $rootScope.destroyed = true;
          player.destroy();
        }
      };

      // fired on any youtube state change, checks for a video ended event and
      // plays next song if yes
      $window.loadNext = function loadNext(event) {
        var topSong = $scope.sortedSongs[0];
        if (topSong && event.data === YT.PlayerState.ENDED && socket.id() === Event.creator) {
          player.loadVideoById(topSong.id);
          socket.emit('removeSong', topSong.id);
        }
      };

      // if the songs list used to be empty but now isn't, call the
      // onYouTubeIframAPIReady function (for loading reasons, has to be called
      // manually like this when you return from the search page)
      $scope.$watch('songs',
        function (newVal, oldVal) {
          if ($rootScope.destroyed && newVal.length > 0) {
            $rootScope.destroyed = false;
            $window.onYouTubeIframeAPIReady();
          }
        });
    }

  ])
  .controller('SearchController', ['$scope', '$state', 'socket', 'searchFactory', 'Event',
    //******SearchController capitalized here, but not in original file. Check that it is consistently used in *****
    //HTML partial using this controller.
    function ($scope, $state, socket, searchFactory, Event) {
      console.log('in search controller');
      //array of results we get back from the you tubes
      $scope.searchResults = [];

      //link back to event
      $scope.home = function () {
        $state.go('event.playlist');
      };

      //function called when insider hits the add button
      //defers work to the factory, just passes along the song obj.
      $scope.addSong = function (song) {
        searchFactory.addSong(song);
      };

      //defers the http call to the factory, then adds the songs to the
      //local array
      $scope.getSearchResults = function (searchTerm) {
        $scope.searchResults = [];

        searchFactory.getSearchResults(searchTerm)
          .then(function (result) {
            result.items.forEach(function (song) {
              var songObj = {
                id: song.id.videoId,
                url: 'https://www.youtube.com/embed/' + song.id.videoId,
                title: song.snippet.title,
                thumbnail: song.snippet.thumbnails.medium.url,
                votes: 0
              };
              $scope.searchResults.push(songObj);
              $scope.searchTerm = '';
            });
          });
      };

      socket.on('songAdded', function (song) {
        console.log(song);
      });
    }
  ]);
