const express = require('express');
const { scrapeVidsrc } = require('@definisi/vidsrc-scraper');

const app = express();
const port = process.env.PORT || 3000;

// Funcție pentru conversie IMDb → TMDB (folosind API-ul public TMDB)
async function convertImdbToTmdb(imdbId) {
    const apiKey = 'YOUR_TMDB_API_KEY'; // Înlocuiește cu cheia ta TMDB
    const url = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${apiKey}&external_source=imdb_id`;
    const response = await fetch(url);
    const data = await response.json();
    return data.movie_results?.[0]?.id || null;
}

app.get('/extract', async (req, res) => {
    let imdbId = req.query.imdb;
    let tmdbId = req.query.tmdbId;

    // Dacă avem IMDb ID, îl convertim
    if (imdbId && !tmdbId) {
        try {
            tmdbId = await convertImdbToTmdb(imdbId);
            if (!tmdbId) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Could not convert IMDb to TMDB ID' 
                });
            }
        } catch (error) {
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to convert IMDb to TMDB: ' + error.message 
            });
        }
    }

    if (!tmdbId) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing tmdbId or imdb parameter' 
        });
    }

    console.log(`[${new Date().toISOString()}] Extracting for TMDB ID: ${tmdbId}`);

    try {
        const result = await scrapeVidsrc(tmdbId, 'movie');

        if (result.success && result.hlsUrl) {
            res.json({ 
                success: true, 
                m3u8: result.hlsUrl,
                subtitles: result.subtitles 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'M3U8 not found' 
            });
        }

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error:`, error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'M3U8 Proxy is running. Use /extract?imdb=tt0110357 or /extract?tmdbId=10395' 
    });
});

app.listen(port, () => {
    console.log(`[${new Date().toISOString()}] Proxy running on port ${port}`);
});
