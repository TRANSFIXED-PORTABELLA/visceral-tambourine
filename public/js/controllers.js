angular.module('app.controllers', [])
  .controller('LandingController', ['$scope', '$location', 'socket', 'Event',
    function ($scope, $location, socket, Event) {
      //function called when join button clicked
      $scope.join = function (event) {
        //send the event to the server
        socket.emit('join', event);
        socket.on('success', function (success) {
          if (success) {
            Event.event = event;
            //move the insider into the event
            $location.path('/events/' + event);
          } else {
            $scope.error = true;
          }
        })
      };
      //directs user to the create event page
      $scope.create = function () {
        $location.path('/create');
      };
    }
  ])
  .controller('CreateController', ['$scope', '$location', 'socket', 'Event',
    function ($scope, $location, socket, Event) {
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
            $location.path('/events/' + event);
          } else {
            $scope.error = true;
          }
        });
      };
    }
  ])
  .controller('PlaylistController', ['$scope', '$state', 'socket', 'Event',
    function ($scope, $state, socket, Event) {

      $scope.songs = Event.getSongs();

      socket.on('songAdded', function (song) {
        if (Event.songs.indexOf(song) === -1) {
          Event.addSong(song);
          $scope.songs = Event.getSongs();
        }
      });

      $scope.voteUp = function (song) {
        song.votes++
        socket.emit('voteUp', song);
      }

      // $scope.voteDown = function (song) {
      //   song.votes--
      //   socket.emit('voteDown', song);
      // }

      socket.on('votedUp', function (song) {
        for (var i = 0; i < Event.songs.length; i++) {
          if (Event.songs[i].id === song.id) {
            Event.songs[i] = song;
            $scope.songs = Event.getSongs();
          }
        }
      });


      // socket.on('votedDown', function (song) {
      //   for (var i = 0; i < Event.songs.length; i++) {
      //     if (Event.songs[i].id === song.id) {
      //       Event.songs[i] = song;
      //       $scope.songs = Event.getSongs();
      //     }
      //   }
      // });

    }
  ])
  .controller('EventController', ['$window', '$scope', '$state', 'socket', 'Event',
    function ($window, $scope, $state, socket, Event) {

      //    ##INITIAL ROOM SETUP##

      // this variable will let us hide the player from event insiders other than
      // the creator
      $scope.isCreator = socket.id() === Event.creator;
      //set playlist view as default
      $state.go('event.playlist');
      // to keep track of which song is up
      $scope.songIndex = 0;
      //let the server know that insider has arrived in the room.


      socket.emit('joined');
      socket.on('welcome', function (songs) {
        //add the songs from the server to the local array
        //making sure thats its empty before doing so
        console.log("SONGS FROM SERVER", songs);
        console.log("EVENT.SONGS", Event.songs);
        if (Event.songs.length === 0) {
          for (var i = 0; i < songs.length; i++) {
            Event.addSong(songs[i]);
          }
          $scope.songs = Event.getSongs();
          console.log("LOOOOOOOOK!!!!", $scope.songs);
        }
      });

      $scope.songs = Event.getSongs();

      socket.on('songAdded', function (song) {
        $scope.songs = Event.getSongs();
      })
      //Logic for sharing the url of the event
      $scope.roomInvite = $state.href($state.current.name, $state.params, {
        absolute: true
      });
      $scope.shareEvent = function () {
        new Clipboard('.share');
      };

      //link to the search view
      $scope.search = function () {
        $state.go('event.search');
      };


      // fired when the youtube iframe api is ready
      $window.onPlayerReady = function onPlayerReady(event) {
        console.log("ready");
        if ($scope.songs[$scope.songIndex] && socket.id() === Event.creator) {
          player.cueVideoById($scope.songs[$scope.songIndex].id);
          $scope.songIndex++;
          event.target.playVideo();
        } else {
          player.destroy();
        }
      };

      // fired on any youtube state change, checks for a video ended event and
      // plays next song if yes
      $window.loadNext = function loadNext(event) {
        if ($scope.songs[$scope.songIndex] && event.data === YT.PlayerState.ENDED && $scope.isCreator) {
          console.log("loadNext");
          player.loadVideoById($scope.songs[$scope.songIndex].id);
          $scope.songIndex++;
        }
        console.log("loadnext");
      };

      // if the songs list used to be empty but now isn't, call the
      // onYouTubeIframAPIReady function (for loading reasons, has to be called
      // manually like this when you return from the search page)
      $scope.$watch(function (scope) {
          return scope.songs;
        },
        function (newVal, oldVal) {
          if (oldVal.length === 0 && newVal.length > 0) {
            $window.onYouTubeIframeAPIReady();
          }
        });

    }

  ])
  .controller('SearchController', ['$scope', '$state', 'socket', 'searchFactory', 'Event',
    //******SearchController capitalized here, but not in original file. Check that it is consistently used in *****
    //HTML partial using this controller.
    function ($scope, $state, socket, searchFactory, Event) {
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
                thumbnail: song.snippet.thumbnails.medium.url
              };
              $scope.searchResults.push(songObj);
              $scope.searchTerm = '';
            });
          });
      };
    }
  ]);