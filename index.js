const express = require('express');
const tmdbScrape = require('vidsrc.ts');

const app = express();
const port = process.env.PORT || 3000;

// Endpoint pentru extragere
app.get('/extract', async (req, res) => {
    // Suportă atât imdb cât și tmdbId
    let imdbId = req.query.imdb;
    let tmdbId = req.query.tmdbId;

    // Dacă avem imdb, trebuie să îl convertim în tmdbId
    if (imdbId && !tmdbId) {
        try {
            // Convertim IMDb în TMDB folosind API-ul TMDB
            const apiKey = 'YOUR_TMDB_API_KEY'; // Înlocuiește cu cheia ta
            const response = await fetch(`https://api.themoviedb.org/3/find/${imdbId}?api_key=${apiKey}&external_source=imdb_id`);
            const data = await response.json();
            if (data.movie_results && data.movie_results.length > 0) {
                tmdbId = data.movie_results[0].id;
            } else {
                return res.status(404).json({ success: false, error: 'Movie not found on TMDB' });
            }
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Failed to convert IMDb to TMDB' });
        }
    }

    if (!tmdbId) {
        return res.status(400).json({ error: 'Missing tmdbId or imdb parameter' });
    }

    console.log(`[${new Date().toISOString()}] Extracting for TMDB ID: ${tmdbId}`);

    try {
        // Folosește vidsrc.ts pentru a extrage stream-ul
        const result = await tmdbScrape(tmdbId, 'movie');
        
        if (result && result.hlsUrl) {
            res.json({ success: true, m3u8: result.hlsUrl });
        } else {
            res.status(404).json({ success: false, error: 'M3U8 not found' });
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error:`, error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint pentru testare
app.get('/', (req, res) => {
    res.json({ 
        message: 'M3U8 Proxy is running on Vercel!',
        usage: '/extract?tmdbId=550 (Fight Club) or /extract?imdb=tt0110357 (The Lion King)'
    });
});

app.listen(port, () => {
    console.log(`[${new Date().toISOString()}] M3U8 proxy is running on port ${port}`);
});
