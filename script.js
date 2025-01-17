console.log("Lets write JavaScript");

let currentSong = new Audio();
let songs;
let currFolder;
let previousVolume = 0.1; // Initialize with default volume

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
  currFolder = folder;
  let a = await fetch(`http://127.0.0.1:5500/${folder}/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  songs = [];
  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      songs.push(element.href.split(`/${folder}/`)[1]);
    }
  }
  return songs;
}

const playMusic = (track, pause = false) => {
  currentSong.src = `/${currFolder}/` + track;
  if (!pause) {
    currentSong.play();
    play.src = "SVG/pause.svg";
  }
  document.querySelector(".songinfo").innerHTML = decodeURI(track);
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function loadArtistSongs(artistId) {
  // songs = await loadPlaylistByArtist('3cEYpjA9oz9GiPac4AsH4n', 5);
  songs = await loadAlbumByArtist(artistId, 5); // KK
  // playMusic(songs[0], true);

  // Show all the songs in the playlist
  let songUL = document
    .querySelector(".songList")
    .getElementsByTagName("ul")[0];
  songUL.innerHTML = "";
  for (const song of songs) {
    songUL.innerHTML += `
      <li>
        <img class="invert" width="34" src="SVG/music.svg" alt="">
        <div class="info">
          <div>${song.track.album.name}</div>
          <div>${song.track.album.artists.map((a) => a.name).join(", ")}</div>
        </div>
        <div class="playnow">
          <span>Play Now</span>
          <img class="invert" src="SVG/play.svg" alt="">
        </div>
      </li>`;
  }

  // Attach an event listener to each song
  Array.from(
    document.querySelector(".songList").getElementsByTagName("li")
  ).forEach((e) => {
    e.addEventListener("click", (element) => {
      playMusic(
        songs[
          songs.indexOf(
            e.querySelector(".info").firstElementChild.innerHTML.trim()
          )
        ]
      );
    });
  });

  // Attach an event listener to play, next and previous
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "SVG/pause.svg";
    } else {
      currentSong.pause();
      play.src = "SVG/play.svg";
    }
  });

  // Listen for timeupdate event
  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(
      currentSong.currentTime
    )} / ${secondsToMinutesSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  // Add an event listener to seekbar
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  // Add an event listener for hamburger
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  // Add an event listener for close button
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // Add an event listener to previous
  previous.addEventListener("click", () => {
    currentSong.pause();
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index > 0) {
      playMusic(songs[index - 1]);
    } else {
      playMusic(songs[songs.length - 1]); // loop to last song
    }
  });

  // Add an event listener to next
  next.addEventListener("click", () => {
    currentSong.pause();
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index < songs.length - 1) {
      playMusic(songs[index + 1]);
    } else {
      playMusic(songs[0]); // loop to first song
    }
  });

  // Add an event to volume
  document
    .querySelector(".range")
    .getElementsByTagName("input")[0]
    .addEventListener("change", (e) => {
      previousVolume = parseInt(e.target.value) / 100; // track new volume
      currentSong.volume = previousVolume;
    });

  // Add event listener to mute the track
  document.querySelector(".volume>img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      document
        .querySelector(".range")
        .getElementsByTagName("input")[0].value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = previousVolume; // Reset to previous volume
      document.querySelector(".range").getElementsByTagName("input")[0].value =
        previousVolume * 100;
    }
  });
}

var token;

async function fetchToken() {
  let tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: "fd81f9f4e07a41b0923f29af31bc5759",
      client_secret: "fe30b5276884499799de5d495573a435",
    }),
  });

  token = (await tokenRes.json()).access_token;

  loadArtistsDetails();
}

async function loadAlbumByArtist(artistId) {
  let playlist = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/albums?market=IN`,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );

  return (await playlist.json()).items;
}

async function loadPlaylistByArtist(artistId, items) {
  let playlist = await fetch(
    `https://api.spotify.com/v1/playlists/${artistId}/tracks?limit=${items}`,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );

  return (await playlist.json()).items;
}

async function getArtistsList() {
  const artists = [
    "2CIMQHirSU0MQqyYHq0eOx",
    "57dN52uHvrHOxijzpIgu3E",
    "1vCWHaC5f2uS3yhpwWbIA6",
  ];

  let artistsResponse = await fetch(
    `https://api.spotify.com/v1/artists?ids=${artists.join()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  artistsResponse = await artistsResponse.json();
  return artistsResponse.artists;
}

async function loadArtistsDetails() {
  const artists = await getArtistsList();
  let artistList = document.createElement("ul");
  let artistTemplate = document.getElementById("artist-template");
  for (let index = 0; index < artists.length; index++) {
    const artist = artists[index];
    const artistNode = artistTemplate.content.cloneNode(true);
    const artistCard = artistNode.getElementById('artist-card');
    artistCard.addEventListener("click", () => {
      loadArtistSongs(artist.id);
    });

    const artistImg = artistNode.getElementById("artist-image");
    artistImg.setAttribute("src", artist.images[0].url);
    artistImg.setAttribute("alt", "artist thumbnail");

    const artistName = artistNode.getElementById("artist-name");
    artistName.innerHTML = artist.name;

    artistList.appendChild(artistNode);
  }

  artistListContainer = document.getElementById("artist-card-container");
  artistListContainer.innerHTML = "";
  artistListContainer.appendChild(artistList);
}

fetchToken();
