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


document.addEventListener('DOMContentLoaded', function() {
    // Theme toggling
    const themeToggle = document.getElementById('theme-toggle');
    const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    const body = document.body;

    function toggleTheme() {
        body.classList.toggle('dark-theme');
        localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
        updateThemeIcon();
    }

    function updateThemeIcon() {
        const isDark = body.classList.contains('dark-theme');
        themeToggle.innerHTML = `<i class="fas fa-${isDark ? 'sun' : 'moon'}"></i>`;
        mobileThemeToggle.innerHTML = `<i class="fas fa-${isDark ? 'sun' : 'moon'}"></i> Dark/Light Mode`;
    }

    // Set initial theme
    if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        body.classList.add('dark-theme');
    }
    updateThemeIcon();

    themeToggle.addEventListener('click', toggleTheme);
    mobileThemeToggle.addEventListener('click', toggleTheme);

    // Mobile navigation
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const mobileNav = document.querySelector('.mobile-nav');

    hamburgerMenu.addEventListener('click', function() {
        mobileNav.classList.toggle('active');
    });

    // Close mobile nav when clicking outside
    document.addEventListener('click', function(event) {
        if (!mobileNav.contains(event.target) && !hamburgerMenu.contains(event.target)) {
            mobileNav.classList.remove('active');
        }
    });

    // Settings modal
    const settingsButton = document.getElementById('settings-button');
    const mobileSettingsButton = document.getElementById('mobile-settings-button');
    const settingsModal = document.getElementById('settings-modal');

    function toggleSettingsModal() {
        if (settingsModal) {
            settingsModal.classList.toggle('active');
        }
    }

    if (settingsButton) {
        settingsButton.addEventListener('click', toggleSettingsModal);
    }
    if (mobileSettingsButton) {
        mobileSettingsButton.addEventListener('click', toggleSettingsModal);
    }

    // Profile modal
    const profileButton = document.getElementById('profile-button');
    const mobileProfileButton = document.getElementById('mobile-profile-button');
    const profileModal = document.getElementById('profile-modal');

    function toggleProfileModal() {
        if (profileModal) {
            profileModal.classList.toggle('active');
        }
    }

    if (profileButton) {
        profileButton.addEventListener('click', toggleProfileModal);
    }
    if (mobileProfileButton) {
        mobileProfileButton.addEventListener('click', toggleProfileModal);
    }

    // Close modals when clicking outside
    document.addEventListener('click', function(event) {
        if (settingsModal && !settingsModal.contains(event.target) && !settingsButton.contains(event.target) && !mobileSettingsButton.contains(event.target)) {
            settingsModal.classList.remove('active');
        }
        if (profileModal && !profileModal.contains(event.target) && !profileButton.contains(event.target) && !mobileProfileButton.contains(event.target)) {
            profileModal.classList.remove('active');
        }
    });

    // Update current year in footer
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
});
