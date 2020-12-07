let moodPicked;

function createBtn(idName, textContent, isEmoji) {
  let newBtn = document.createElement('button');
  newBtn.setAttribute('id', idName);
  newBtn.setAttribute('type', 'button');
  newBtn.style.setProperty('margin', '2px');
  
  if (isEmoji) {
    newBtn.style.setProperty('font-size', '250%')
  } else {
    newBtn.style.setProperty('font-size', '125%')
  }


  let text = document.createTextNode(textContent);
  newBtn.appendChild(text);
  return newBtn;
}

function getAPI(event) {
  const mood = moodPicked.split('-')[0];
  if (mood === "happy") {
    console.log("what??")
  }
  const data = { moodName: mood };
  fetch('/makePlaylist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(resp => resp.json())
  .then(data => window.open(data.playlistUrl, '_blank'))
  .catch(error => alert('Something went wrong creating your playlist: ' + error));
}

function addPlaylistButton(event) {
  let spoodButtons = document.querySelector('.buttons-container');
  spoodButtons.removeEventListener('click', addPlaylistButton);
  spoodButtons.remove();
  
  moodPicked = event.target.id;
  console.log(moodPicked);
  let buttonsDiv = document.createElement('div');
  buttonsDiv.classList.add('playlist-buttons');
  
  let plyBtn = createBtn('playlist-button', "Make Playlist", false);
  plyBtn.addEventListener('click', getAPI);
  let backBtn = createBtn('back-button', "Back", false);
  backBtn.addEventListener('click', addMoodButtons);
  
  buttonsDiv.appendChild(plyBtn);
  buttonsDiv.appendChild(backBtn);
  
  
  let emojiText = "";
  if (moodPicked.split('-')[0] === "happy") {
    emojiText = String.fromCodePoint(0x1F60A);
  } else {
    emojiText = String.fromCodePoint(0x1F622);
  }
  let picked = document.createElement('p');
  let pickedText = document.createTextNode("You selected " + emojiText);
  picked.appendChild(pickedText);
  picked.style.setProperty('font-size', '175%');
  picked.style.setProperty('margin', '0');
    
  let container = document.createElement('div');
  container.classList.add('playlist-container');
  container.style.setProperty('display', 'block')
  container.appendChild(picked);
  
  container.appendChild(buttonsDiv);
  document.body.appendChild(container);
}

function addMoodButtons() {
  if (document.querySelector('.playlist-container')) {
    let plyBtn = document.getElementById('playlist-button');
    let backBtn = document.getElementById('back-button');
    plyBtn.removeEventListener('click', getAPI);
    backBtn.removeEventListener('click', addMoodButtons);
    let plyDiv = document.querySelector('.playlist-container');
    plyDiv.remove();
  }
  
  let newDiv = document.createElement('div');
  newDiv.classList.add('buttons-container');

  
  let happyBtn = createBtn('happy-button', String.fromCodePoint(0x1F60A), true);
  let sadBtn = createBtn('sad-button', String.fromCodePoint(0x1F622), true);
  
  newDiv.appendChild(happyBtn);
  newDiv.appendChild(sadBtn);
  
  newDiv.addEventListener('click', addPlaylistButton);
  document.body.appendChild(newDiv);
}

addMoodButtons();