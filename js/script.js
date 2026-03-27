// ============================================
// GLOBAL VARIABLES
// ============================================
const SONGS_API_BASE = "/songs";
const currentSong = new Audio();
let songs = [];

// ============================================
// UTILITY FUNCTIONS
// ============================================
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

function getTrackName(trackUrl) {
    return decodeURIComponent(trackUrl).split("/").pop().split(".")[0];
}

function setPlayButtonState(isPlaying) {
    play.src = isPlaying ? "img/pause.svg" : "img/play.svg";
}

// ============================================
// CORE FUNCTIONS
// ============================================
async function getsongs(folder) {
    songs = [];
    let anchors = [];

    try {
        let response = await fetch(`${SONGS_API_BASE}/${folder}/`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        anchors = div.getElementsByTagName("a");
    } catch (error) {
        console.error(`Could not load songs from ${SONGS_API_BASE}/${folder}/`, error);
    }

    for (let element of anchors) {
        if (element.href.endsWith(".mp3") || element.href.endsWith(".ogg")) {
            // Extract filename and build correct path
            const filename = element.href.split("/").pop();
            const correctPath = `${SONGS_API_BASE}/${folder}/${filename}`;
            songs.push(correctPath);
        }
    }

    // SHOW ALL SONGS IN PLAYLIST
    let songUl = document.querySelector(".songs-list").getElementsByTagName("ul")[0];
    songUl.innerHTML = "";

    for (const song of songs) {
        let cleanName = getTrackName(song);

        songUl.innerHTML += `<li data-song-url="${song}" data-song-name="${cleanName}">
            <img src="img/music-note-svgrepo-com.svg" alt="music">
            <div class="info">
                <div>${cleanName}</div>
                <div>Alok</div>
            </div>
            <div class="playnow">
                <span>play now</span>
                <img src="img/play-1000-svgrepo-com.svg" alt="">
            </div>
        </li>`;
    }

    // PLAY SONG OF LIBRARY 
    Array.from(document.querySelector(".songs-list").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.getAttribute("data-song-url"), e.getAttribute("data-song-name"));
            setPlayButtonState(true);
        });
    });

    return songs;
}

const playMusic = (track, name) => {
    currentSong.src = track;
    currentSong.play();
    document.querySelector(".songinfo").innerHTML = name;
    document.querySelector(".songtime").innerHTML = "00:00";
};

// ============================================
// HAMBURGER MENU HELPER FUNCTION
// ============================================
const closeSidebarOnClickOutside = (e) => {
    const leftSidebar = document.querySelector(".left");
    const hamburger = document.querySelector(".hamburger");

    if (!leftSidebar.contains(e.target) && !hamburger.contains(e.target)) {
        leftSidebar.style.left = "-130%";
        document.removeEventListener("click", closeSidebarOnClickOutside);
    }
};

// ============================================
// DISPLAY ALBUMS FUNCTION
// ============================================
async function displayAlbums() {
    // ALBUM FOLDERS ARE AUTOMATICALLY FETCHED AND ADDED TO ALBUM-CONTAINER
    console.log("adding albums from folder");
    let anchors = [];

    try {
        let response = await fetch(`${SONGS_API_BASE}/`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        anchors = Array.from(div.getElementsByTagName("a"));
    } catch (error) {
        console.error(`Could not load albums from ${SONGS_API_BASE}/`, error);
        return;
    }
    let albumContainer = document.querySelector(".album-container");

    if (!albumContainer) return;

    albumContainer.innerHTML = "";

    for (const e of anchors) {
        const href = decodeURIComponent(e.getAttribute("href") || "").replace(/\\/g, "/");
        
        // Skip parent directory and non-folder links
        if (!href || href === "../" || !href.endsWith("/")) continue;
        
        // Extract folder name (remove trailing slash)
        const folder = href.slice(0, -1);
        if (!folder || folder === "..") continue;

        try {
            const info = await (await fetch(`${SONGS_API_BASE}/${folder}/info.json`)).json();
            albumContainer.innerHTML += `<div data-folder="${folder}" class="album">
                            <div class="image-container">
                                <img src="${SONGS_API_BASE}/${folder}/cover.jpg" alt="${info.title || folder}">
                                <img class="play" src="img/play-1000-svgrepo-com.svg" alt="play">
                            </div>
                            <h4>${info.title || folder}</h4>
                            <p>${info.description || ""}</p>
                        </div>`;
        } catch (error) {
            console.warn(`Could not load album metadata for folder: ${folder}`, error);
        }
    }


    // Attach event listeners to albums
    Array.from(document.querySelectorAll(".album")).forEach(album => {
        album.addEventListener("click", async () => {
            const folder = album.getAttribute("data-folder");
            // Clear the songs list
            let songUl = document.querySelector(".songs-list ul");
            songUl.innerHTML = "";
            // Fetch and display songs from the selected folder
            songs = await getsongs(folder);
            // Play the first song if available
            if (songs.length > 0) {
                let cleanName = getTrackName(songs[0]);
                playMusic(songs[0], cleanName);
                setPlayButtonState(true);
            }
        });
    });
}

// ============================================
// MAIN FUNCTION - EVENT LISTENERS
// ============================================
async function main() {
    try {
        // Initialize with songs
        songs = await getsongs("copy");

        // Initialize with albums display
        await displayAlbums();
    } catch (error) {
        console.error("Failed during initial app loading", error);
    }

    // -------- TRENDING SONG CARD CLICK --------
    const firstTrendingCard = document.querySelector(".Trending-Song .card");
    if (firstTrendingCard) {
        firstTrendingCard.addEventListener("click", () => {
            const songUrl = "/songs/Original/Dandadan.ogg";
            playMusic(songUrl, "Dandadan");
            setPlayButtonState(true);
        });
    }

    // -------- 1. PLAY/PAUSE CONTROLS --------
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            setPlayButtonState(true);
        } else {
            currentSong.pause();
            setPlayButtonState(false);
        }
    });

    // -------- 2. PROGRESS TRACKING --------
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)}/${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // -------- 3. SEEKBAR CONTROLS --------
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // -------- 4. HAMBURGER MENU --------
    document.querySelector(".hamburger").addEventListener("click", () => {
        const leftSidebar = document.querySelector(".left");
        leftSidebar.style.left = "0";

        // Add logo at the top if not already present
        if (!leftSidebar.querySelector(".sidebar-header")) {
            const header = document.createElement("div");
            header.className = "sidebar-header";
            header.innerHTML = `
                <div class="logo-mobile">
                    <img class="invert" src="img/logo.svg" alt="logo">
                    <div class="brandname">PHONKY</div>
                </div>
                <img class="close-btn invert" src="img/close0button.svg" alt="">
            `;
            leftSidebar.insertBefore(header, leftSidebar.firstChild);

            // Close button functionality
            header.querySelector(".close-btn").addEventListener("click", () => {
                leftSidebar.style.left = "-130%";
                document.removeEventListener("click", closeSidebarOnClickOutside);
            });
        }

        // Close sidebar when clicking outside
        setTimeout(() => {
            document.addEventListener("click", closeSidebarOnClickOutside);
        }, 0);
    });

    // -------- 5. PREVIOUS/NEXT BUTTONS --------
    previous.addEventListener("click", () => {
        currentSong.pause();
        console.log("Previous clicked");
        let index = songs.indexOf(currentSong.src);
        if ((index - 1) >= 0) {
            let songUrl = songs[index - 1];
            let cleanName = getTrackName(songUrl);
            playMusic(songUrl, cleanName);
            setPlayButtonState(true);
        }
    });

    next.addEventListener("click", () => {
        currentSong.pause();
        console.log("Next clicked");
        let index = songs.indexOf(currentSong.src);
        if ((index + 1) < songs.length) {
            let songUrl = songs[index + 1];
            let cleanName = getTrackName(songUrl);
            playMusic(songUrl, cleanName);
            setPlayButtonState(true);
        }
    });

    // -------- 6. VOLUME CONTROL --------
    const volumeIcon = document.getElementById("volumeIcon");
    const volumeSliderContainer = document.getElementById("volumeSliderContainer");
    const volumeRange = document.getElementById("volumeRange");

    volumeIcon.addEventListener("click", () => {
        volumeSliderContainer.classList.toggle("show");
    });

    volumeRange.addEventListener("input", (e) => {
        currentSong.volume = e.target.value / 100;
        console.log("Volume:", e.target.value);

        // Update volume icon based on volume level
        if (currentSong.volume > 0.6) {
            volumeIcon.src = "img/volume.svg";
        } else if (currentSong.volume > 0.2) {
            volumeIcon.src = "img/volume60.svg";
        } else if (currentSong.volume > 0) {
            volumeIcon.src = "img/volume20.svg";
        } else if (currentSong.volume == 0) {
            volumeIcon.src = "img/muted.svg";
        }
    });

    // Close volume slider when clicking outside
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".volume")) {
            volumeSliderContainer.classList.remove("show");
        }
    });
}

// ============================================
// INITIALIZE APPLICATION
// ============================================
main();
