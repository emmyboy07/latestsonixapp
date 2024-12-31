const TMDB_API_KEY = '4047600e7b714de665db30e862139d92';
const YOUTUBE_API_KEY = 'AIzaSyDQzMwNQpOvL7CPmT2Fhlxi0gp99dP4piM';
const DAILYMOTION_API_KEY = '3d76cb201c8f34c0f89b';
const DAILYMOTION_API_SECRET = '2ce48fb77a5bd6b175edd2d37f354c12d508f2c5';

const BASE_URL = 'https://api.themoviedb.org/3';
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const DAILYMOTION_BASE_URL = 'https://api.dailymotion.com';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const movieGrid = document.getElementById('movie-grid');
const nollywoodGrid = document.getElementById('nollywood-grid');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const modal = document.getElementById('movie-modal');
const modalTitle = document.getElementById('modal-title');
const modalOverview = document.getElementById('modal-overview');
const modalPoster = document.getElementById('modal-poster');
const watchTrailerBtn = document.getElementById('watch-trailer');
const watchMovieBtn = document.getElementById('watch-movie');
const closeBtn = document.getElementsByClassName('close')[0];
const sectionToggle = document.getElementById('section-toggle');
const themeToggle = document.getElementById('theme-toggle');

let currentPage = 1;
let currentNollywoodPage = '';
let currentSearchQuery = '';
let youtubePlayer;
let dailymotionPlayer;
let isLoading = false;

// Fetch popular movies on page load
fetchPopularMovies();
fetchNollywoodMovies('Nollywood movie');

// Event listeners
if (searchButton) {
    searchButton.addEventListener('click', () => {
        currentPage = 1;
        currentNollywoodPage = '';
        currentSearchQuery = searchInput ? searchInput.value : '';
        if (sectionToggle.checked) {
            fetchNollywoodMovies(currentSearchQuery);
        } else {
            searchMovies();
        }
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
}

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

if (sectionToggle) {
    sectionToggle.addEventListener('change', toggleSection);
}

if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500 && !isLoading) {
        if (sectionToggle.checked) {
            fetchNollywoodMovies('Nollywood movie', currentNollywoodPage);
        } else {
            loadMoreMovies();
        }
    }
});

// Fetch popular movies
async function fetchPopularMovies() {
    if (isLoading) return;
    isLoading = true;
    try {
        const response = await fetch(`${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${currentPage}`);
        if (!response.ok) throw new Error('Failed to fetch popular movies');
        const data = await response.json();
        if (movieGrid) {
            const moviesWithPosters = data.results.filter(movie => movie.poster_path);
            displayMovies(moviesWithPosters, currentPage === 1);
            currentPage++;
        } else {
            throw new Error('Movie grid element not found');
        }
    } catch (error) {
        console.error('Error fetching popular movies:', error);
        showErrorMessage('Failed to load movies. Please try again later.');
    } finally {
        isLoading = false;
    }
}

// Fetch Nollywood movies
async function fetchNollywoodMovies(query, pageToken = '') {
    if (isLoading) return;
    isLoading = true;
    try {
        const url = `${YOUTUBE_BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&pageToken=${pageToken}&type=video&videoDuration=long`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch Nollywood movies');
        const data = await response.json();
        if (nollywoodGrid) {
            displayNollywoodMovies(data.items, pageToken === '');
            currentNollywoodPage = data.nextPageToken || '';
        } else {
            throw new Error('Nollywood grid element not found');
        }
    } catch (error) {
        console.error('Error fetching Nollywood movies:', error);
        showErrorMessage('Failed to load Nollywood movies. Please try again later.');
    } finally {
        isLoading = false;
    }
}

// Search movies
async function searchMovies() {
    if (currentSearchQuery) {
        try {
            const response = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${currentSearchQuery}&page=${currentPage}`);
            if (!response.ok) throw new Error('Failed to search movies');
            const data = await response.json();
            const moviesWithPosters = data.results.filter(movie => movie.poster_path);
            displayMovies(moviesWithPosters, currentPage === 1);
            currentPage++;
        } catch (error) {
            console.error('Error searching movies:', error);
            showErrorMessage('Failed to search movies. Please try again later.');
        }
    }
}

// Load more movies
function loadMoreMovies() {
    if (currentSearchQuery) {
        searchMovies();
    } else {
        fetchPopularMovies();
    }
}

// Display movies
function displayMovies(movies, clearExisting = true) {
    if (!movieGrid) {
        console.error('Movie grid element not found');
        return;
    }

    if (clearExisting) {
        movieGrid.innerHTML = '';
    }
    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.innerHTML = `
            <img src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'placeholder.jpg'}" alt="${movie.title}">
            <h3>${movie.title}</h3>
            <p><i class="fas fa-star"></i> ${movie.vote_average.toFixed(1)}</p>
        `;
        movieCard.addEventListener('click', () => openModal(movie));
        movieGrid.appendChild(movieCard);
    });
}

// Display Nollywood movies
function displayNollywoodMovies(movies, clearExisting = true) {
    if (!nollywoodGrid) {
        console.error('Nollywood grid element not found');
        return;
    }

    if (clearExisting) {
        nollywoodGrid.innerHTML = '';
    }
    movies.forEach(movie => {
        const videoId = movie.id.videoId;
        const title = movie.snippet.title;
        const thumbnailUrl = movie.snippet.thumbnails.high.url;
        const channelTitle = movie.snippet.channelTitle;
        const publishedAt = new Date(movie.snippet.publishedAt).toLocaleDateString();

        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        
        movieCard.innerHTML = `
            <img src="${thumbnailUrl}" alt="${title}">
            <h3>${title}</h3>
            <p><i class="fas fa-user"></i> ${channelTitle}</p>
            <p><i class="fas fa-calendar-alt"></i> ${publishedAt}</p>
        `;

        movieCard.addEventListener('click', () => openNollywoodModal(movie));
        nollywoodGrid.appendChild(movieCard);
    });
}

// Open modal
async function openModal(movie) {
    modalTitle.textContent = movie.title;
    modalOverview.textContent = movie.overview;
    modalPoster.src = movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'placeholder.jpg';
    modal.style.display = 'block';

    try {
        const trailerUrl = await fetchYouTubeTrailer(movie.title);
        watchTrailerBtn.onclick = () => playYouTubeTrailer(trailerUrl);
        watchTrailerBtn.disabled = false;
    } catch (error) {
        console.error('Error fetching YouTube trailer:', error);
        watchTrailerBtn.disabled = true;
        watchTrailerBtn.textContent = 'Trailer Unavailable';
    }

    watchMovieBtn.onclick = () => playDailymotionMovie(movie.title);
}

// Open Nollywood modal
function openNollywoodModal(movie) {
    modalTitle.textContent = movie.snippet.title;
    modalOverview.textContent = movie.snippet.description;
    modalPoster.src = movie.snippet.thumbnails.high.url;
    modal.style.display = 'block';

    watchTrailerBtn.onclick = () => playYouTubeTrailer(`https://www.youtube.com/watch?v=${movie.id.videoId}`);
    watchTrailerBtn.disabled = false;
    
    watchMovieBtn.style.display = 'none';
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
    if (youtubePlayer) {
        youtubePlayer.stopVideo();
    }
    if (dailymotionPlayer) {
        dailymotionPlayer.pause();
    }
    watchMovieBtn.style.display = 'inline-block';
}

// Fetch YouTube trailer
async function fetchYouTubeTrailer(movieTitle) {
    const response = await fetch(`${YOUTUBE_BASE_URL}/search?part=snippet&q=${movieTitle} trailer&key=${YOUTUBE_API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch YouTube trailer');
    const data = await response.json();
    if (data.items.length === 0) throw new Error('No trailer found');
    return `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`;
}

// Play YouTube trailer
function playYouTubeTrailer(trailerUrl) {
    const videoId = trailerUrl.split('v=')[1];
    modalPoster.style.display = 'none';
    if (!youtubePlayer) {
        youtubePlayer = new YT.Player('video-container', {
            height: '360',
            width: '640',
            videoId: videoId,
            events: {
                'onReady': (event) => event.target.playVideo()
            }
        });
    } else {
        youtubePlayer.loadVideoById(videoId);
    }
}

// Play Dailymotion movie
async function playDailymotionMovie(movieTitle) {
    try {
        const videoId = await searchDailymotionVideo(movieTitle);
        modalPoster.style.display = 'none';
        if (!dailymotionPlayer) {
            dailymotionPlayer = DM.player(document.getElementById('video-container'), {
                video: videoId,
                width: '640',
                height: '360',
                params: {
                    autoplay: true,
                    mute: false
                }
            });
        } else {
            dailymotionPlayer.load(videoId);
        }
    } catch (error) {
        console.error('Error playing Dailymotion video:', error);
        showErrorMessage('Failed to play the movie. Please try again later.');
    }
}

// Search Dailymotion video
async function searchDailymotionVideo(movieTitle) {
    const response = await fetch(`${DAILYMOTION_BASE_URL}/videos?fields=id&search=${movieTitle}&limit=1`);
    if (!response.ok) throw new Error('Failed to search Dailymotion video');
    const data = await response.json();
    if (data.list.length === 0) throw new Error('No video found on Dailymotion');
    return data.list[0].id;
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.classList.add('error-message');
    errorDiv.textContent = message;

    const mainElement = document.querySelector('main');
    if (mainElement) {
        mainElement.insertBefore(errorDiv, mainElement.firstChild);
    } else {
        console.error('Main element not found. Error:', message);
    }
}

// Toggle between sections
function toggleSection() {
    const tmdbSection = document.getElementById('tmdb-section');
    const nollywoodSection = document.getElementById('nollywood-section');

    if (sectionToggle.checked) {
        tmdbSection.classList.remove('active');
        nollywoodSection.classList.add('active');
    } else {
        tmdbSection.classList.add('active');
        nollywoodSection.classList.remove('active');
    }
}

// Toggle theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

