document.getElementById('login').addEventListener('click', function(e) {
    e.preventDefault();
    fetch('/spotifyRedirectUri')
    .then(response => response.json())
    .then(data => { window.location = data.authorizeUrl; })
    .catch(error => { alert("Failed to prepare for Spotify Authentication")});
  });