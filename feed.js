const TMDB_API_KEY = '4047600e7b714de665db30e862139d92';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3/';
let isLoading = false;
let currentPage = 1;
let allMovies = [];
let usedVideos = new Set(); // Store video keys to prevent duplicates
const preFetchThreshold = 500; // Load more when near the bottom

// Initialize Intersection Observer
const observerOptions = {
    root: null,
    threshold: 0.7,
};

const observer = new IntersectionObserver(handleIntersect, observerOptions);

// Handle Intersection Events
function handleIntersect(entries) {
    entries.forEach(entry => {
        const videoElement = entry.target.querySelector('iframe');

        if (entry.isIntersecting) {
            // Play the visible video
            entry.target.classList.add('active');
            videoElement.contentWindow.postMessage('{"event":"command","func":"playVideo"}', '*');
            videoElement.muted = false;

            // Pause all other videos
            document.querySelectorAll('.trailer-item').forEach(item => {
                if (item !== entry.target) {
                    const otherVideo = item.querySelector('iframe');
                    otherVideo.contentWindow.postMessage('{"event":"command","func":"pauseVideo"}', '*');
                    otherVideo.muted = true;
                    item.classList.remove('active');
                }
            });
        } else {
            // Pause the non-visible video
            videoElement.contentWindow.postMessage('{"event":"command","func":"pauseVideo"}', '*');
            videoElement.muted = true;
            entry.target.classList.remove('active');
        }
    });
}

// Fetch movies from TMDB API
async function fetchMovies(page) {
    try {
        const response = await fetch(`${TMDB_BASE_URL}discover/movie?api_key=${TMDB_API_KEY}&page=${page}`);
        const data = await response.json();
        return data.results.filter(movie => movie.poster_path && movie.backdrop_path);
    } catch (error) {
        console.error('Error fetching movies:', error);
        return [];
    }
}

// Fetch a random movie trailer
async function fetchRandomTrailer() {
    while (true) {
        // Randomly pick a movie from allMovies
        const randomIndex = Math.floor(Math.random() * allMovies.length);
        const movie = allMovies[randomIndex];

        // Skip if we've already shown this movie
        if (usedVideos.has(movie.id)) continue;

        try {
            const response = await fetch(`${TMDB_BASE_URL}movie/${movie.id}/videos?api_key=${TMDB_API_KEY}`);
            const data = await response.json();
            const trailer = data.results.find(video => video.type === 'Trailer');

            if (trailer) {
                usedVideos.add(movie.id); // Mark this movie as used
                return { movie, trailer };
            }
        } catch (error) {
            console.error('Error fetching trailer:', error);
        }
    }
}

// Display trailers
async function displayTrailers() {
    if (isLoading) return;
    isLoading = true;

    if (allMovies.length === 0 || allMovies.length === usedVideos.size) {
        // Fetch more movies if we run out of unused movies
        const movies = await fetchMovies(currentPage++);
        allMovies = allMovies.concat(movies);
    }

    const { movie, trailer } = await fetchRandomTrailer();

    const trailerItem = document.createElement('div');
    trailerItem.classList.add('trailer-item');
    trailerItem.innerHTML = `
        <iframe class="video-player"
            src="https://www.youtube.com/embed/${trailer.key}?enablejsapi=1&autoplay=0&controls=0&rel=0&loop=1&playlist=${trailer.key}"
            frameborder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowfullscreen
            muted
        ></iframe>
        <h2>${movie.title}</h2>
        <p>${movie.overview}</p>
    `;

    document.getElementById('movie-feed').appendChild(trailerItem);
    observer.observe(trailerItem);

    isLoading = false;
}

// Scroll Event to Load More Trailers
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - preFetchThreshold && !isLoading) {
        displayTrailers();
    }
});

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    displayTrailers();
});

// Get elements
const hamburgerMenu = document.getElementById('hamburger-menu');
const mobileNav = document.querySelector('.mobile-nav');
const cancelButton = document.getElementById('cancel-menu');

// Toggle mobile navigation visibility on hamburger menu click
hamburgerMenu.addEventListener('click', () => {
   mobileNav.classList.toggle('active');  // This will open/close the menu
});

// Close the mobile navigation when the cancel button is clicked
cancelButton.addEventListener('click', () => {
   mobileNav.classList.remove('active');  // This will close the menu
});