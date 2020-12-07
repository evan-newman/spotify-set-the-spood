// init project
var express = require('express')
var axios = require('axios');
var bodyParser = require('body-parser');
var app = express();

// init Spotify API wrapper
var SpotifyWebApi = require('spotify-web-api-node');

var scopes = ['user-read-private', 'user-read-email', 'user-top-read', 'playlist-modify-public', 'playlist-modify-private'],
    redirectUri = 'https://set-the-spood.glitch.me/callback',
    clientId = process.env.CLIENT_ID;

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: 'https://set-the-spood.glitch.me/callback'
});

var authorizeUrl = spotifyApi.createAuthorizeURL(scopes);
console.log(authorizeUrl);

let tokenExpirationEpoch;
let accessToken;

function authenticate(code) {
  spotifyApi.authorizationCodeGrant(code).then(
    function(data) {
      console.log('The token expires in ' + data.body['expires_in']);
      console.log('The access token is ' + data.body['access_token']);
      console.log('The refresh token is ' + data.body['refresh_token']);
      
      accessToken = data.body['access_token'];

      // Set the access token on the API object to use it in later calls
      spotifyApi.setAccessToken(data.body['access_token']);
      // spotifyApi.setRefreshToken(data.body['refresh_token']);
      // console.log(spotifyApi.getAccessToken());
      
      // tokenExpirationEpoch =
      // new Date().getTime() / 1000 + data.body['expires_in'];
      // console.log(
      //   'Retrieved token. It expires in ' +
      //     Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) +
      //     ' seconds!'
      // );
    },
    function(err) {
      console.log('Something went wrong!', err);
    }
  );
}

const reAuthenticateOnFailure = (action) => {
  action(() => {
    authenticate(action);
  })
}

// Code pulled from spotifyAPI SDK github page to refreash the token once it expires automatically
// let numberOfTimesUpdated = 0;
// setInterval(function() {

//   // OK, we need to refresh the token. Stop printing and refresh.
//   if (++numberOfTimesUpdated > 5) {
//     clearInterval(this);

//     // Refresh token and print the new time to expiration.
//     spotifyApi.refreshAccessToken().then(
//       function(data) {
//         accessToken = data.body['access_token'];
//         tokenExpirationEpoch =
//           new Date().getTime() / 1000 + data.body['expires_in'];
//         console.log(
//           'Refreshed token. It now expires in ' +
//             Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) +
//             ' seconds!'
//         );
//       },
//       function(err) {
//         console.log('Could not refresh the token!', err.message);
//       }
//     );
//   }
// }, 1000);

app.get("/callback",function(req, res) {
  reAuthenticateOnFailure((failure) => {
    if(req.query.code) {
      authenticate(req.query.code);
      res.redirect("/spood.html");
    }
    console.log("Spood");
  })
});


app.use(bodyParser.json())
app.use(express.static('public'));


app.get("/spotifyRedirectUri", function (request, response) {
  response.send(JSON.stringify({
    authorizeUrl
  }, null, 2))
});


function getThoseTopArtists() {
  return new Promise(function (resolve, reject) {
    
    // spotifyApi.resetAccessToken()
    resolve(
      spotifyApi.getMyTopArtists({ limit : 4 })
        .then(function(data) {
        let topArtists = data.body.items;
        let userTopArtists = []
        for (var i = 0; i < topArtists.length; i++) {
          userTopArtists.push(topArtists[i].id);
        }
          console.log("First");
          console.log("top artists: ", userTopArtists)
          return userTopArtists
        })
        .catch(err => console.log('Something went wrong getting Top Artists', err))
      );
    });
}

function getThoseRecommendations(userTopArtists, minEnergyLevel, maxEnergyLevel, targetDance, mode, targetValence, mood) {
  return new Promise(function (resolve, reject) {

    resolve(
      spotifyApi.getRecommendations({
        min_energy: minEnergyLevel,
        max_energy: maxEnergyLevel,
        target_danceability: targetDance,
        mode: mode,
        target_valence: targetValence,
        seed_artists: userTopArtists,
        seed_genres: mood,
        popularity: 25
      })
      .then(function(data) {
        let recommendations = data.body;
        let recomSongs = []
        for (var i = 0; i < recommendations.tracks.length; i++) {
          recomSongs.push(recommendations.tracks[i].uri);
        }
        console.log("Second");
        return recomSongs
      })
      .catch(err => console.log("something went wrong getting Recommendations", err))
    ); 
  });
}

function createPlaylist(playlistName) {
  return new Promise(function (resolve, reject) {
    
    resolve(
      spotifyApi.createPlaylist(playlistName, { 'description': '', 'public': true })
      .then(function(data) {
        console.log('Created playlist!');
        return data.body.id;
      })
      .catch(err => console.log('Something went wrong!', err))
    );
    
//     spotifyApi.getMe()
//     .then(function(data) {
//       let userId = data.body.id;

//       var data = JSON.stringify({"name":playlistName});
//       var config = {
//         method: 'post',
//         url: 'https://api.spotify.com/v1/users/' + userId + '/playlists',
//         headers: { 
//           'Authorization': 'Bearer ' + spotifyApi.getAccessToken(), 
//           'Content-Type': 'application/json', 
//         },
//         data : data
//       };

//       resolve(
//       axios(config)
//       .then(function (response) {
//         console.log("Third");
//         data = JSON.stringify(response.data);
//         data = JSON.parse(data);
//         let idNewPlaylist = data["id"];
//         return idNewPlaylist;
//       })
//       .catch(function (error) {
//         console.log(error);
//       })
//         );
//     })
//     .catch(err => console.log("something went wrong Creating the playlist", err))
  });
}

function addTracksToPlaylist(idNewPlaylist, recomSongs) {
  return new Promise(function (resolve, reject) {
    
    resolve(
      spotifyApi.addTracksToPlaylist(idNewPlaylist, recomSongs)
      .then(function(data) {
        console.log('Added tracks to playlist!');
      })
      .catch(err => console.log('Something went wrong adding tracks to the playlist', err))
    );
  });
}

function allTogetherNow(mood) {
  return new Promise(function (resolve, reject) {
    
    let minEnergyLevel;
    let maxEnergyLevel;
    let playlistName;
    let targetDance;
    let mode;
    let targetValence;

    if (mood === 'happy') {
      playlistName = "Set Mood to " + String.fromCodePoint(0x1F60A);
      minEnergyLevel = 0.6;
      maxEnergyLevel = 1;
      targetDance = 0.7;
      mode = 1;
      targetValence = 0.8;
    } else if (mood === 'sad') {
      playlistName = "Set Mood to " + String.fromCodePoint(0x1F622);
      minEnergyLevel = 0;
      maxEnergyLevel = 0.4;
      targetDance = 0.3;
      mode = 0;
      targetValence = 0.2;
    }
    
    let recomSongs
    resolve(
    getThoseTopArtists()
    .then(temp => getThoseRecommendations(temp, minEnergyLevel, maxEnergyLevel, targetDance, mode, targetValence, mood))
    .then(next => {recomSongs = next;
                  return createPlaylist(playlistName);
                  })
    .then(playlistId => {addTracksToPlaylist(playlistId, recomSongs);
                          return playlistId;
                        })
    );
    
  });
}


app.post('/makePlaylist', function (req, res) {
  reAuthenticateOnFailure((failure) => {
    spotifyApi.getMe()
    .then(function(data) {
      console.log('Some information about the authenticated user', data.body);
    }, function(err) {
      console.log('Something went wrong!', err);
    });
    let mood = req.body.moodName;
    console.log(mood);
    allTogetherNow(mood)
      .then( idNewPlaylist => {
        console.log(idNewPlaylist)
        let playlistUrl = "https://open.spotify.com/playlist/" + idNewPlaylist
        res.send(JSON.stringify({
          playlistUrl
          }, null, 2))
    });
  });
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
