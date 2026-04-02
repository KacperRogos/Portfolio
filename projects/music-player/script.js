const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const playIcon = playBtn.querySelector('.play-icon');
const pauseIcon = playBtn.querySelector('.pause-icon');
const vinylDisc = document.querySelector('.vinyl-disc');
const albumImage = document.getElementById('albumImage');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const playCount = document.getElementById('playCount');
const songDuration = document.getElementById('songDuration');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const progressHandle = document.getElementById('progressHandle');
const volumeBtn = document.getElementById('volumeBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const playlistEl = document.getElementById('playlist');
const addSongBtn = document.getElementById('addSongBtn');
const clearPlaylistBtn = document.getElementById('clearPlaylistBtn');
const fileInput = document.getElementById('fileInput');
const visualizer = document.getElementById('visualizer');
let currentSongIndex = 0;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 0; 
let playlist = [];
const ITUNES_API = 'https://itunes.apple.com';
async function init() {
    setupAudioVisualizer();
    setupEventListeners();
    loadItunesTracks();
}
function mapItunesTrack(t) {
    return {
        title: t.trackName || t.collectionName || 'Nieznany',
        artist: t.artistName || 'Nieznany artysta',
        duration: formatTime((t.trackTimeMillis || 0) / 1000),
        thumbnail: '',
        artwork: (t.artworkUrl100 || '').replace('100x100', '300x300'),
        url: t.previewUrl || '',
        playCount: 0,
        isItunes: true
    };
}

async function loadItunesTracks() {
    try {
        showLoadingMessage('Ładowanie muzyki z iTunes...');
        const response = await fetch(
            `${ITUNES_API}/search?term=top+hits&media=music&limit=20&country=PL`
        );
        if (!response.ok) throw new Error('iTunes API error');
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const tracks = data.results.filter(t => t.previewUrl).map(mapItunesTrack);
            const wasEmpty = playlist.length === 0;
            playlist = [...playlist, ...tracks];
            renderPlaylist();
            hideLoadingMessage();
            if (wasEmpty) loadSong(0);
        }
    } catch (error) {
        console.error('Błąd ładowania iTunes:', error);
        hideLoadingMessage();
        showAPIError('iTunes');
    }
}

async function searchItunes(query) {
    try {
        showLoadingMessage('Szukam utworów...');
        const response = await fetch(
            `${ITUNES_API}/search?term=${encodeURIComponent(query)}&media=music&limit=25&country=PL`
        );
        if (!response.ok) throw new Error('Błąd wyszukiwania');
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const tracks = data.results.filter(t => t.previewUrl).map(mapItunesTrack);
            if (tracks.length === 0) {
                hideLoadingMessage();
                alert('Nie znaleziono podglądów dla tych utworów');
                return [];
            }
            playlist = tracks;
            renderPlaylist();
            hideLoadingMessage();
            loadSong(0);
            return tracks;
        } else {
            hideLoadingMessage();
            alert('Nie znaleziono utworów');
            return [];
        }
    } catch (error) {
        console.error('Błąd wyszukiwania iTunes:', error);
        hideLoadingMessage();
        alert('Błąd wyszukiwania. Spróbuj ponownie.');
        return [];
    }
}

async function loadItunesByGenre(genre) {
    try {
        showLoadingMessage(`Ładowanie ${genre}...`);
        const genreMap = {
            'electronic': 'electronic music',
            'rock': 'rock',
            'pop': 'pop',
            'jazz': 'jazz',
            'chill': 'chillout ambient',
            'ambient': 'ambient'
        };
        const term = genreMap[genre.toLowerCase()] || genre;
        const response = await fetch(
            `${ITUNES_API}/search?term=${encodeURIComponent(term)}&media=music&limit=25&country=PL`
        );
        if (!response.ok) throw new Error('iTunes API error');
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const tracks = data.results.filter(t => t.previewUrl).map(mapItunesTrack);
            playlist = tracks;
            renderPlaylist();
            hideLoadingMessage();
            if (tracks.length > 0) loadSong(0);
        } else {
            hideLoadingMessage();
        }
    } catch (error) {
        console.error('Błąd ładowania gatunku:', error);
        hideLoadingMessage();
    }
}
function showLoadingMessage(message = 'Ładowanie muzyki...') {
    playlistEl.innerHTML = `
        <div class="playlist-empty">
            <div class="playlist-empty-icon">
                <div class="spinner" style="width: 50px; height: 50px; border: 3px solid rgba(102, 126, 234, 0.3); border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
            <p>${message}</p>
        </div>
    `;
}
function hideLoadingMessage() {
}
function showAPIError(apiName) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'api-error';
    errorDiv.style.cssText = 'background: rgba(255, 68, 68, 0.1); border: 1px solid rgba(255, 68, 68, 0.3); padding: 1rem; border-radius: 12px; margin: 1rem 0; text-align: center; color: #ff4444;';
    errorDiv.innerHTML = `
        <p><strong>${apiName} API nie odpowiada</strong></p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">Używamy demo utworów. Sprawdź połączenie internetowe.</p>
    `;
    const playlistSection = document.querySelector('.playlist-section');
    playlistSection.insertBefore(errorDiv, playlistEl);
}
function setupEventListeners() {
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', updateDuration);
    audioPlayer.addEventListener('ended', handleSongEnd);
    progressBar.addEventListener('click', seek);
    volumeSlider.addEventListener('input', changeVolume);
    volumeBtn.addEventListener('click', toggleMute);
    addSongBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    clearPlaylistBtn.addEventListener('click', clearPlaylist);
    const searchBtn = document.getElementById('searchSoundCloudBtn');
    const searchInput = document.getElementById('soundcloudSearch');
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchItunes(query);
        }
    });
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                searchItunes(query);
            }
        }
    });
    document.addEventListener('keydown', handleKeyPress);
    audioPlayer.volume = volumeSlider.value / 100;
}
function togglePlay() {
    if (isPlaying) {
        pause();
    } else {
        play();
    }
}
function play() {
    const promise = audioPlayer.play();
    if (promise !== undefined) {
        promise.then(() => {
            isPlaying = true;
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
            vinylDisc.classList.add('spinning');
        }).catch(err => {
            console.error('Playback failed:', err);
            isPlaying = false;
        });
    } else {
        isPlaying = true;
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        vinylDisc.classList.add('spinning');
    }
}
function pause() {
    audioPlayer.pause();
    isPlaying = false;
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    vinylDisc.classList.remove('spinning');
}
function playPrevious() {
    if (isShuffle) {
        currentSongIndex = Math.floor(Math.random() * playlist.length);
    } else {
        currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    }
    loadSong(currentSongIndex);
    if (isPlaying) play();
}
function playNext() {
    if (repeatMode === 2) {
        audioPlayer.currentTime = 0;
        play();
        return;
    }
    if (isShuffle) {
        currentSongIndex = Math.floor(Math.random() * playlist.length);
    } else {
        currentSongIndex = (currentSongIndex + 1) % playlist.length;
    }
    loadSong(currentSongIndex);
    if (isPlaying) play();
}
function handleSongEnd() {
    if (repeatMode === 2) {
        audioPlayer.currentTime = 0;
        play();
    } else if (repeatMode === 1 || currentSongIndex < playlist.length - 1) {
        playNext();
    } else {
        pause();
        currentSongIndex = 0;
        loadSong(0);
    }
}
async function loadSong(index) {
    if (!playlist[index]) return;
    const song = playlist[index];
    currentSongIndex = index;
    audioPlayer.src = song.url;
    if (song.artwork) {
        albumImage.src = song.artwork;
    } else {
        albumImage.src = `https://placehold.co/300x300/667eea/ffffff?text=♪`;
    }
    songTitle.textContent = song.title;
    songArtist.textContent = song.artist;
    playCount.textContent = song.playCount ? formatNumber(song.playCount) : '0';
    updatePlaylistActiveState();
}
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}
function updateProgress() {
    const { currentTime, duration } = audioPlayer;
    if (duration) {
        const progressPercent = (currentTime / duration) * 100;
        progressFill.style.width = `${progressPercent}%`;
        progressHandle.style.left = `${progressPercent}%`;
        currentTimeEl.textContent = formatTime(currentTime);
    }
}
function updateDuration() {
    const { duration } = audioPlayer;
    if (duration) {
        totalTimeEl.textContent = formatTime(duration);
        songDuration.textContent = formatTime(duration);
    }
}
function seek(e) {
    const width = progressBar.offsetWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    audioPlayer.currentTime = (clickX / width) * duration;
}
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
function changeVolume() {
    const volume = volumeSlider.value;
    audioPlayer.volume = volume / 100;
    volumeValue.textContent = `${volume}%`;
    updateVolumeIcon(volume);
}
function toggleMute() {
    if (audioPlayer.volume > 0) {
        audioPlayer.volume = 0;
        volumeSlider.value = 0;
        volumeValue.textContent = '0%';
    } else {
        audioPlayer.volume = 0.7;
        volumeSlider.value = 70;
        volumeValue.textContent = '70%';
    }
    updateVolumeIcon(volumeSlider.value);
}
function updateVolumeIcon(volume) {
    const volumeWaves = volumeBtn.querySelector('.volume-waves');
    if (volume == 0) {
        volumeWaves.style.display = 'none';
    } else {
        volumeWaves.style.display = 'block';
    }
}
function toggleShuffle() {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active');
}
function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    if (repeatMode === 0) {
        repeatBtn.classList.remove('active');
        repeatBtn.title = 'Powtarzaj: Wyłączone';
    } else if (repeatMode === 1) {
        repeatBtn.classList.add('active');
        repeatBtn.title = 'Powtarzaj: Wszystkie';
    } else {
        repeatBtn.classList.add('active');
        repeatBtn.title = 'Powtarzaj: Jeden';
    }
}
function renderPlaylist() {
    if (playlist.length === 0) {
        playlistEl.innerHTML = `
            <div class="playlist-empty">
                <div class="playlist-empty-icon"></div>
                <p>Playlista jest pusta</p>
                <p style="font-size: 0.9rem;">Wyszukaj utwory na Jamendo lub dodaj własne pliki</p>
            </div>
        `;
        return;
    }
    playlistEl.innerHTML = playlist.map((song, index) => {
        const thumbnail = song.artwork 
            ? `<img src="${song.artwork}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;" alt="${song.title}">` 
            : `<div style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">${song.thumbnail}</div>`;
        const badge = song.isItunes 
            ? `<span style="font-size: 0.7rem; color: #fc3c44; margin-left: 0.5rem;">iTunes</span>` 
            : '';
        return `
        <div class="playlist-item ${index === currentSongIndex ? 'active' : ''}" data-index="${index}">
            <div class="playlist-item-number">${index + 1}</div>
            <div class="playlist-item-thumbnail">${thumbnail}</div>
            <div class="playlist-item-info">
                <div class="playlist-item-title">${song.title}${badge}</div>
                <div class="playlist-item-artist">${song.artist}</div>
            </div>
            <div class="playlist-item-duration">${song.duration}</div>
            <div class="playlist-item-actions">
                <button class="playlist-item-btn" onclick="playSongAtIndex(${index})" title="Odtwórz">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path fill-rule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clip-rule="evenodd" />
                    </svg>
                </button>
                <button class="playlist-item-btn" onclick="removeSong(${index})" title="Usuń">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    `;
    }).join('');
    document.querySelectorAll('.playlist-item').forEach(item => {
        item.addEventListener('dblclick', (e) => {
            if (!e.target.closest('.playlist-item-actions')) {
                const index = parseInt(item.dataset.index);
                playSongAtIndex(index);
            }
        });
    });
}
function updatePlaylistActiveState() {
    document.querySelectorAll('.playlist-item').forEach((item, index) => {
        if (index === currentSongIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}
function playSongAtIndex(index) {
    currentSongIndex = index;
    loadSong(index);
    play();
}
function removeSong(index) {
    playlist.splice(index, 1);
    if (index === currentSongIndex) {
        if (playlist.length > 0) {
            currentSongIndex = Math.min(currentSongIndex, playlist.length - 1);
            loadSong(currentSongIndex);
        } else {
            pause();
        }
    } else if (index < currentSongIndex) {
        currentSongIndex--;
    }
    renderPlaylist();
}
function clearPlaylist() {
    if (confirm('Czy na pewno chcesz wyczyścić playlistę?')) {
        playlist = [];
        pause();
        renderPlaylist();
    }
}
function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        if (file.type.startsWith('audio/')) {
            const url = URL.createObjectURL(file);
            const song = {
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: "Nieznany artysta",
                duration: "?:??",
                thumbnail: "",
                url: url,
                file: file
            };
            playlist.push(song);
            const audio = new Audio(url);
            audio.addEventListener('loadedmetadata', () => {
                song.duration = formatTime(audio.duration);
                renderPlaylist();
            });
        }
    });
    renderPlaylist();
    fileInput.value = ''; 
}
function setupAudioVisualizer() {
    const canvas = visualizer;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    let audioContext, analyser, dataArray, bufferLength;
    audioPlayer.addEventListener('play', () => {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaElementSource(audioPlayer);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            analyser.fftSize = 256;
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
        }
        draw();
    }, { once: true });
    function draw() {
        if (!isPlaying) {
            requestAnimationFrame(draw);
            return;
        }
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        ctx.fillStyle = 'rgba(26, 26, 46, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
            const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }
    draw();
}
function handleKeyPress(e) {
    if (e.target.tagName === 'INPUT') return;
    switch(e.key) {
        case ' ':
            e.preventDefault();
            togglePlay();
            break;
        case 'ArrowRight':
            e.preventDefault();
            playNext();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            playPrevious();
            break;
        case 'ArrowUp':
            e.preventDefault();
            volumeSlider.value = Math.min(100, parseInt(volumeSlider.value) + 10);
            changeVolume();
            break;
        case 'ArrowDown':
            e.preventDefault();
            volumeSlider.value = Math.max(0, parseInt(volumeSlider.value) - 10);
            changeVolume();
            break;
        case 'm':
        case 'M':
            toggleMute();
            break;
        case 's':
        case 'S':
            toggleShuffle();
            break;
        case 'r':
        case 'R':
            toggleRepeat();
            break;
    }
}
window.addEventListener('resize', () => {
    visualizer.width = visualizer.offsetWidth;
    visualizer.height = visualizer.offsetHeight;
});

document.addEventListener('DOMContentLoaded', init);
