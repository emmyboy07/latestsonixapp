const TMDB_API_KEY = '4047600e7b714de665db30e862139d92';
const YOUTUBE_API_KEY = 'AIzaSyB073rVyNEwqTlWDoodMMIAwKcasgsPKuM';
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
const movieModal = document.getElementById('movie-modal');
const settingsModal = document.getElementById('settings-modal');
const profileModal = document.getElementById('profile-modal');
const modalTitle = document.getElementById('modal-title');
const modalOverview = document.getElementById('modal-overview');
const modalPoster = document.getElementById('modal-poster');
const watchTrailerBtn = document.getElementById('watch-trailer');
const watchMovieBtn = document.getElementById('watch-movie');
const closeBtn = document.getElementsByClassName('close');
const sectionToggle = document.getElementById('section-toggle');
const themeToggle = document.getElementById('theme-toggle');
const settingsButton = document.getElementById('settings-button');
const profileButton = document.getElementById('profile-button');
const saveSettingsButton = document.getElementById('save-settings');
const profileForm = document.getElementById('profile-form');
const profileDisplay = document.getElementById('profile-display');
const genreCheckboxes = document.getElementById('genre-checkboxes');
const loadingSpinner = document.getElementById('loading-spinner');
const errorContainer = document.getElementById('error-container');

let currentPage = 1;
let currentNollywoodPage = '';
let currentSearchQuery = '';
let youtubePlayer;
let dailymotionPlayer;
let isLoading = false;
let nollywoodMovies = [];
let genres = [];

// Load user settings
let userSettings = JSON.parse(localStorage.getItem('sonixMoviesSettings')) || {
    defaultSection: 'international',
    moviesPerPage: 20,
    autoPlayTrailers: false,
    selectedGenres: [],
    darkMode: false
};

// Load user profile
let userProfile = JSON.parse(localStorage.getItem('sonixMoviesProfile')) || {
    name: '',
    email: '',
    image: ''
};

// Initialize app with user settings
async function initApp() {
    document.getElementById('default-section').value = userSettings.defaultSection;
    document.getElementById('movies-per-page').value = userSettings.moviesPerPage;
    document.getElementById('auto-play-trailers').checked = userSettings.autoPlayTrailers;
    document.getElementById('dark-mode').checked = userSettings.darkMode;

    if (userSettings.defaultSection === 'nollywood') {
        sectionToggle.checked = true;
        toggleSection();
    }

    if (userSettings.darkMode) {
        document.body.classList.add('dark-mode');
    }

    await fetchGenres();
    populateGenreCheckboxes();

    updateProfileButton();
    updateProfileDisplay();
    updateUserGreeting();

    if (sectionToggle.checked) {
        fetchNollywoodMovies('Nollywood movie');
    } else {
        fetchPopularMovies();
    }
}

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

Array.from(closeBtn).forEach(btn => {
    btn.addEventListener('click', closeModal);
});

window.addEventListener('click', (event) => {
    if (event.target === movieModal || event.target === settingsModal || event.target === profileModal) {
        closeModal();
    }
});

if (sectionToggle) {
    sectionToggle.addEventListener('change', toggleSection);
}

if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

if (settingsButton) {
    settingsButton.addEventListener('click', openSettingsModal);
}

if (profileButton) {
    profileButton.addEventListener('click', openProfileModal);
}

if (saveSettingsButton) {
    saveSettingsButton.addEventListener('click', saveSettings);
}

if (profileForm) {
    profileForm.addEventListener('submit', saveProfile);
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

// Show loading spinner
function showLoadingSpinner() {
    loadingSpinner.classList.remove('hidden');
}

// Hide loading spinner
function hideLoadingSpinner() {
    loadingSpinner.classList.add('hidden');
}

// Show error message
function showErrorMessage(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
}

// Hide error message
function hideErrorMessage() {
    errorContainer.textContent = '';
    errorContainer.classList.add('hidden');
}

// Fetch popular movies
async function fetchPopularMovies() {
    if (isLoading) return;
    isLoading = true;
    showLoadingSpinner();
    hideErrorMessage();
    try {
        let url = `${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${currentPage}`;
        if (userSettings.selectedGenres.length > 0) {
            url += `&with_genres=${userSettings.selectedGenres.join(',')}`;
        }
        const response = await fetch(url);
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
        hideLoadingSpinner();
    }
}

// Fetch Nollywood movies
async function fetchNollywoodMovies(query, pageToken = '') {
    if (isLoading || nollywoodMovies.length >= userSettings.moviesPerPage) return;
    isLoading = true;
    showLoadingSpinner();
    hideErrorMessage();
    try {
        const url = `${YOUTUBE_BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&pageToken=${pageToken}&type=video&videoDuration=long&maxResults=${userSettings.moviesPerPage - nollywoodMovies.length}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch Nollywood movies');
        const data = await response.json();
        if (nollywoodGrid) {
            nollywoodMovies = [...nollywoodMovies, ...data.items];
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
        hideLoadingSpinner();
    }
}

// Fetch genres
async function fetchGenres() {
    showLoadingSpinner();
    hideErrorMessage();
    try {
        const response = await fetch(`${BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`);
        if (!response.ok) throw new Error('Failed to fetch genres');
        const data = await response.json();
        genres = data.genres;
    } catch (error) {
        console.error('Error fetching genres:', error);
        showErrorMessage('Failed to load genres. Please try again later.');
    } finally {
        hideLoadingSpinner();
    }
}

// Populate genre checkboxes
function populateGenreCheckboxes() {
    genres.forEach(genre => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="genre" value="${genre.id}"> ${genre.name}`;
        genreCheckboxes.appendChild(label);
    });
    updateSelectedGenres();
}

// Update selected genres
function updateSelectedGenres() {
    const checkboxes = genreCheckboxes.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = userSettings.selectedGenres.length === 0 || userSettings.selectedGenres.includes(checkbox.value);
    });
}

// Display random Nollywood movie
function displayRandomNollywoodMovie() {
    if (nollywoodMovies.length > 0) {
        const randomIndex = Math.floor(Math.random() * nollywoodMovies.length);
        const randomMovie = nollywoodMovies[randomIndex];
        openNollywoodModal(randomMovie);
    }
}

// Search movies
async function searchMovies() {
    if (currentSearchQuery) {
        showLoadingSpinner();
        hideErrorMessage();
        try {
            let url = `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${currentSearchQuery}&page=${currentPage}`;
            if (userSettings.selectedGenres.length > 0) {
                url += `&with_genres=${userSettings.selectedGenres.join(',')}`;
            }
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to search movies');
            const data = await response.json();
            const moviesWithPosters = data.results.filter(movie => movie.poster_path);
            displayMovies(moviesWithPosters, currentPage === 1);
            currentPage++;
        } catch (error) {
            console.error('Error searching movies:', error);
            showErrorMessage('Failed to search movies. Please try again later.');
        } finally {
            hideLoadingSpinner();
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
    clearModalContent();
    modalTitle.textContent = movie.title;
    modalOverview.textContent = movie.overview;
    modalPoster.src = movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'placeholder.jpg';
    movieModal.style.display = 'block';

    showLoadingSpinner();
    hideErrorMessage();

    try {
        const movieDetails = await fetchMovieDetails(movie.id);
        displayMovieDetails(movieDetails);

        const trailerUrl = await fetchYouTubeTrailer(movie.title);
        watchTrailerBtn.onclick = () => playYouTubeTrailer(trailerUrl);
        watchTrailerBtn.disabled = false;
        watchTrailerBtn.textContent = 'Watch Trailer';
        if (userSettings.autoPlayTrailers) {
            playYouTubeTrailer(trailerUrl);
        }

        const dailymotionVideoId = await searchDailymotionVideo(movie.title, movieDetails.runtime);
        if (dailymotionVideoId) {
            watchMovieBtn.onclick = () => playDailymotionMovie(dailymotionVideoId);
            watchMovieBtn.disabled = false;
            watchMovieBtn.textContent = 'Watch Movie (Dailymotion)';
        } else {
            const youtubeFullMovieId = await searchYouTubeFullMovie(movie.title, movieDetails.runtime);
            if (youtubeFullMovieId) {
                watchMovieBtn.onclick = () => playYouTubeMovie(youtubeFullMovieId);
                watchMovieBtn.disabled = false;
                watchMovieBtn.textContent = 'Watch Movie (YouTube)';
            } else {
                watchMovieBtn.disabled = true;
                watchMovieBtn.textContent = 'Full Movie Unavailable';
            }
        }
    } catch (error) {
        console.error('Error loading movie details:', error);
        showErrorMessage('Failed to load movie details. Please try again later.');
        watchTrailerBtn.disabled = true;
        watchTrailerBtn.textContent = 'Trailer Unavailable';
        watchMovieBtn.disabled = true;
        watchMovieBtn.textContent = 'Full Movie Unavailable';
    } finally {
        hideLoadingSpinner();
    }

    watchMovieBtn.style.display = 'inline-block';
}

// Open Nollywood modal
function openNollywoodModal(movie) {
    clearModalContent();
    modalTitle.textContent = movie.snippet.title;
    modalOverview.textContent = movie.snippet.description;
    modalPoster.src = movie.snippet.thumbnails.high.url;
    movieModal.style.display = 'block';

    watchTrailerBtn.onclick = () => playYouTubeTrailer(`https://www.youtube.com/watch?v=${movie.id.videoId}`);
    watchTrailerBtn.disabled = false;
    watchTrailerBtn.textContent = 'Watch Now';
    
    if (userSettings.autoPlayTrailers) {
        playYouTubeTrailer(`https://www.youtube.com/watch?v=${movie.id.videoId}`);
    }
    
    watchMovieBtn.style.display = 'none';
}

// Clear modal content
function clearModalContent() {
    modalTitle.textContent = '';
    modalOverview.textContent = '';
    modalPoster.src = '';
    document.getElementById('movie-details').innerHTML = '';
    if (youtubePlayer) {
        youtubePlayer.destroy();
        youtubePlayer = null;
    }
    if (dailymotionPlayer) {
        dailymotionPlayer.pause();
    }
}

// Close modal
function closeModal() {
    movieModal.style.display = 'none';
    settingsModal.style.display = 'none';
    profileModal.style.display = 'none';
    clearModalContent();
}

// Fetch movie details
async function fetchMovieDetails(movieId) {
    const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,release_dates`);
    if (!response.ok) throw new Error('Failed to fetch movie details');
    return await response.json();
}

// Display movie details
function displayMovieDetails(movie) {
    const movieDetailsContainer = document.getElementById('movie-details');
    
    // Format release date
    const releaseDate = new Date(movie.release_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Get MPAA rating
    const mpaaRating = movie.release_dates.results
        .find(release => release.iso_3166_1 === 'US')?.release_dates
        .find(date => date.certification)?.certification || 'Not Rated';

    // Get director
    const director = movie.credits.crew.find(person => person.job === 'Director')?.name || 'Unknown';

    // Get top 5 cast members
    const topCast = movie.credits.cast.slice(0, 5).map(actor => actor.name).join(', ');

    // Create HTML for additional movie details
    const additionalDetails = `
        <p><strong>Release Date:</strong> ${releaseDate}</p>
        <p><strong>Runtime:</strong> ${movie.runtime} minutes</p>
        <p><strong>Rating:</strong> ${mpaaRating}</p>
        <p><strong>Director:</strong> ${director}</p>
        <p><strong>Cast:</strong> ${topCast}</p>
        <p><strong>Genres:</strong> ${movie.genres.map(genre => genre.name).join(', ')}</p>
        <p><strong>Average Rating:</strong> ${movie.vote_average.toFixed(1)}/10 (${movie.vote_count} votes)</p>
    `;

    movieDetailsContainer.innerHTML = additionalDetails;
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
function playDailymotionMovie(videoId) {
    modalPoster.style.display = 'none';
    const videoContainer = document.getElementById('video-container');
    videoContainer.innerHTML = `
        <iframe src="https://www.dailymotion.com/embed/video/${videoId}"
                width="100%"
                height="360"
                frameborder="0"
                allowfullscreen
                allow="autoplay">
        </iframe>
    `;
}

// Search Dailymotion video
async function searchDailymotionVideo(movieTitle, runtime) {
    const response = await fetch(`${DAILYMOTION_BASE_URL}/videos?fields=id,title,duration&search=${encodeURIComponent(movieTitle)}&limit=5`);
    if (!response.ok) throw new Error('Failed to search Dailymotion video');
    const data = await response.json();
    
    // Filter results based on title and duration
    const matchingVideos = data.list.filter(video => {
        const titleMatch = video.title.toLowerCase().includes(movieTitle.toLowerCase());
        const durationMatch = Math.abs(video.duration - runtime * 60) < 300; // Allow 5 minutes difference
        return titleMatch && durationMatch;
    });

    return matchingVideos.length > 0 ? matchingVideos[0].id : null;
}

// Search YouTube full movie
async function searchYouTubeFullMovie(movieTitle, runtime) {
    const response = await fetch(`${YOUTUBE_BASE_URL}/search?part=snippet&q=${encodeURIComponent(movieTitle + " full movie")}&key=${YOUTUBE_API_KEY}&type=video&videoDuration=long`);
    if (!response.ok) throw new Error('Failed to search YouTube full movie');
    const data = await response.json();

    if (data.items.length === 0) return null;

    // Get video details to check duration
    const videoId = data.items[0].id.videoId;
    const videoDetailsResponse = await fetch(`${YOUTUBE_BASE_URL}/videos?part=contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`);
    if (!videoDetailsResponse.ok) throw new Error('Failed to get YouTube video details');
    const videoDetailsData = await videoDetailsResponse.json();

    const videoDuration = parseDuration(videoDetailsData.items[0].contentDetails.duration);
    
    // Check if the duration is close to the movie runtime (within 10 minutes)
    if (Math.abs(videoDuration - runtime * 60) < 600) {
        return videoId;
    }

    return null;
}

// Parse ISO 8601 duration to seconds
function parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);
    return hours * 3600 + minutes * 60 + seconds;
}

// Play YouTube movie
function playYouTubeMovie(videoId) {
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

// Toggle between sections
function toggleSection() {
    const tmdbSection = document.getElementById('tmdb-section');
    const nollywoodSection = document.getElementById('nollywood-section');

    if (sectionToggle.checked) {
        tmdbSection.classList.remove('active');
        nollywoodSection.classList.add('active');
        if (nollywoodMovies.length === 0) {
            fetchNollywoodMovies('Nollywood movie');
        } else {
            displayNollywoodMovies(nollywoodMovies, true);
        }
    } else {
        tmdbSection.classList.add('active');
        nollywoodSection.classList.remove('active');
        if (movieGrid.children.length === 0) {
            fetchPopularMovies();
        }
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

// Open settings modal
function openSettingsModal() {
    settingsModal.style.display = 'block';
}

// Open profile modal
function openProfileModal() {
    profileModal.style.display = 'block';
    document.getElementById('profile-name').value = userProfile.name;
    document.getElementById('profile-email').value = userProfile.email;
}

// Save settings
function saveSettings() {
    userSettings.defaultSection = document.getElementById('default-section').value;
    userSettings.moviesPerPage = parseInt(document.getElementById('movies-per-page').value);
    userSettings.autoPlayTrailers = document.getElementById('auto-play-trailers').checked;
    userSettings.selectedGenres = Array.from(document.querySelectorAll('input[name="genre"]:checked')).map(checkbox => checkbox.value);
    userSettings.darkMode = document.getElementById('dark-mode').checked;

    localStorage.setItem('sonixMoviesSettings', JSON.stringify(userSettings));
    closeModal();
    currentPage = 1;
    if (sectionToggle.checked) {
        fetchNollywoodMovies('Nollywood movie');
    } else {
        fetchPopularMovies();
    }
}

// Save profile
function saveProfile(event) {
    event.preventDefault();
    userProfile.name = document.getElementById('profile-name').value;
    userProfile.email = document.getElementById('profile-email').value;

    const imageFile = document.getElementById('profile-image').files[0];
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            userProfile.image = e.target.result;
            localStorage.setItem('sonixMoviesProfile', JSON.stringify(userProfile));
            updateProfileButton();
            updateProfileDisplay();
            updateUserGreeting();
            closeModal();
        };
        reader.readAsDataURL(imageFile);
    } else {
        localStorage.setItem('sonixMoviesProfile', JSON.stringify(userProfile));
        updateProfileButton();
        updateProfileDisplay();
        updateUserGreeting();
        closeModal();
    }
}

// Update profile button
function updateProfileButton() {
    if (userProfile.image) {
        profileButton.innerHTML = `<img src="${userProfile.image}" alt="${userProfile.name}">`;
    } else {
        profileButton.innerHTML = '<i class="fas fa-user"></i>';
    }
}

// Update profile display
function updateProfileDisplay() {
    if (profileDisplay) {
        profileDisplay.textContent = userProfile.name ? `Welcome, ${userProfile.name}!` : 'Welcome!';
    }
}

function updateUserGreeting() {
    const greetingElement = document.getElementById('user-greeting');
    if (greetingElement) {
        const greeting = userProfile.name ? `Welcome, ${userProfile.name}!` : 'Welcome!';
        greetingElement.textContent = greeting;
    }
}

// Initialize the app
initApp();

