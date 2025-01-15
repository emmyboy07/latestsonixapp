const puppeteer = require('puppeteer');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Retry action function to handle retries
async function retryAction(action, retries = 3, delay = 2000) {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await action();
        } catch (error) {
            console.warn(`Action failed. Attempt ${attempt}/${retries}: ${error.message}`);
            lastError = error;
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

// Function to capture screenshots
async function captureScreenshot(page, name) {
    try {
        const screenshotPath = path.join(__dirname, 'screenshots');
        await fs.mkdir(screenshotPath, { recursive: true });
        await page.screenshot({ path: path.join(screenshotPath, `${name}.png`), fullPage: true });
        console.log(`Screenshot captured: ${name}.png`);
    } catch (error) {
        console.warn(`Failed to capture screenshot: ${error.message}`);
    }
}

// Main function to search and simulate movie download
async function searchAndDownloadMovie(movieName) {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--allow-running-insecure-content',
        ],
    });

    const page = await browser.newPage();

    try {
        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        console.log("Navigating to MovieBox...");
        await retryAction(() => page.goto('https://moviebox.ng', { waitUntil: 'networkidle0', timeout: 60000 }));
        await captureScreenshot(page, 'homepage');

        async function performSearch() {
            console.log("Waiting for the search input...");
            await retryAction(() => page.waitForSelector('.pc-search-input', { visible: true, timeout: 10000 }));

            console.log(`Typing movie name: ${movieName}`);
            await retryAction(async () => {
                const searchInput = await page.$('.pc-search-input');
                await searchInput.focus();
                await searchInput.type(movieName);
                await page.keyboard.press('Enter');
            });

            console.log("Waiting for search results...");
            await retryAction(() => page.waitForSelector('.pc-card', { visible: true, timeout: 15000 }));
            await captureScreenshot(page, 'search-results');
        }

        await retryAction(performSearch);

        const movieCards = await page.$$('.pc-card');
        if (movieCards.length === 0) {
            throw new Error("No search results found.");
        }

        async function selectFirstResult() {
            console.log("Selecting the first search result...");
            await retryAction(async () => {
                const watchNowButton = await movieCards[0].$('.pc-card-btn');
                if (!watchNowButton) throw new Error("No 'Watch Now' button found.");
                await watchNowButton.click();
                // Wait for the movie details page to load
                await page.waitForSelector('.flx-ce-ce.pc-download-btn', { visible: true, timeout: 30000 });
            });
            await captureScreenshot(page, 'movie-details');
        }

        await retryAction(selectFirstResult);

        async function initiateDownload() {
            await captureScreenshot(page, 'before-download-click');
            console.log("Clicking the download button...");

            await retryAction(async () => {
                const downloadButton = await page.$('.flx-ce-ce.pc-download-btn');
                if (!downloadButton) throw new Error("No download button found.");
                await downloadButton.click();

                // Wait for the download options to appear
                await page.waitForSelector('.pc-select-quality', { visible: true, timeout: 10000 });
            });

            await captureScreenshot(page, 'download-options-visible');
            console.log("Download options are visible");

            // Select the first available resolution
            const resolutionSelector = '.pc-quality-list .pc-itm';
            await page.waitForSelector(resolutionSelector, { visible: true, timeout: 5000 });

            const resolutionOptions = await page.$$(resolutionSelector);
            if (resolutionOptions.length === 0) {
                throw new Error("No resolution options found");
            }

            const selectedOption = resolutionOptions[0];
            const resolution = await selectedOption.$eval('.pc-resolution', el => el.textContent.trim());
            console.log(`Selecting resolution: ${resolution}`);

            await selectedOption.click();
            console.log(`Clicked ${resolution} resolution button`);

            // Replace waitForTimeout with setTimeout workaround
            await new Promise(resolve => setTimeout(resolve, 2000));

            await captureScreenshot(page, 'after-resolution-selection');
            console.log(`Resolution selected: ${resolution}`);
        }

        await initiateDownload();

        // Generate a fake download link
        const fakeDownloadLink = `https://example.com/download/${movieName.replace(/\s+/g, '-')}.mp4`;
        return { downloadLink: fakeDownloadLink };
    } catch (error) {
        console.error("An error occurred:", error.message);
        console.error("Stack trace:", error.stack);
        await captureScreenshot(page, 'error-state');
        throw error;
    } finally {
        console.log("Leaving the browser open for debugging...");
        // Leave the browser open for 30 minutes
        await new Promise(resolve => setTimeout(resolve, 30 * 60 * 1000));
        console.log("Closing the browser after 30 minutes...");
        if (browser && browser.isConnected()) {
            await browser.close();
        }
    }
}

app.post('/download', async (req, res) => {
    const { movieTitle } = req.body;

    if (!movieTitle) {
        return res.status(400).json({ error: 'Movie title is required.' });
    }

    try {
        const { downloadLink } = await searchAndDownloadMovie(movieTitle);
        if (!downloadLink) {
            return res.status(500).json({ error: 'Failed to simulate download.' });
        }
        res.json({ downloadLink, message: 'Download simulated successfully.' });
    } catch (error) {
        console.error('Error during download process:', error);
        res.status(500).json({ error: error.message || 'An unexpected error occurred.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
