document.addEventListener("DOMContentLoaded", () => {
    const downloadsContainer = document.getElementById("downloads-container");

    // Fetch the downloaded movies from the server or local storage
    fetch('/api/downloads')
        .then((response) => response.json())
        .then((downloads) => {
            if (downloads.length === 0) {
                downloadsContainer.innerHTML = `<p>No downloads yet. Start downloading movies to see them here!</p>`;
                return;
            }

            downloadsContainer.innerHTML = downloads.map(movie => `
                <div class="download-item">
                    <img src="${movie.poster}" alt="${movie.title} Poster">
                    <h3>${movie.title}</h3>
                    <button onclick="playMovie('${movie.filePath}')">
                        <i class="fas fa-play"></i> Play
                    </button>
                </div>
            `).join('');
        })
        .catch((error) => {
            console.error("Failed to fetch downloads:", error);
            downloadsContainer.innerHTML = `<p>Error loading downloads. Please try again later.</p>`;
        });
});

// Play a movie
function playMovie(filePath) {
    const videoPlayer = document.createElement('video');
    videoPlayer.src = filePath;
    videoPlayer.controls = true;
    videoPlayer.autoplay = true;
    document.body.appendChild(videoPlayer);
}
