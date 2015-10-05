angular.module('app.services', [])
  .factory('socket', function ($rootScope) {
    //initializes a socket connection on the client
    var socket = io.connect();
    return {
      //this is the angular implementation of the socket io methods on and emit
      //stolen from the internet
      on: function (eventName, callback) {
        socket.on(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        });
      },
      //a getter for the id of the socket
      id: function () {
        return socket.id;
      },
    };
  })
  .factory('searchFactory', ['$http', '$window', 'socket', 'Event',
    function ($http, $window, socket, Event) {
      var key = 'AIzaSyC_7kwz1nFe3CW8DxIcA9j8dI1oOQjOzFM';

      return {
        //The searchFactory getSearch results method handles the get request using the searchTerms provided
        //by the user in the page.
        getSearchResults: function (searchTerm) {
          var editedSearchTerm = searchTerm.split(' ').join('+');

          return $http.get('https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + editedSearchTerm + '&maxResults=10&key=' + key)
            .then(function (res) {
              return res.data;
            }, function (res) {
              console.log('Request Error');
            });
        },

        //The addSong factory method aids the addSong controller method in adding songs to the playlist.
        addSong: function (song) {
          song.votes = 0;
          Event.addSong(song);
          socket.emit('addSong', song);
        },

        //The addSong factory method aids the addSong controller method in redirecting the user to the playlsit
        //after adding a song to the playlist.
        showPlaylist: function () {}

      };
    }
  ])
  .factory('Event', function () {
    //globally stored event name for routing purposes.
    return {
      event: '',
      creator: '',
      songs: [],
      getSongs: function () {
        return this.songs;
      },
      addSong: function (song) {
        this.songs.push(song);
      }
    };
  });
