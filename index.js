const express = require('express');
const { scrapeVidsrc } = require('@definisi/vidsrc-scraper');

const app = express();
const port = process.env.PORT || 3000;

// Endpoint pentru scraping
app.get('/extract', async (req, res) => {
    // Acceptă atât parametrul 'imdb', cât și 'tmdbId'
    const imdbId = req.query.imdb;
    const tmdbId = req.query.tmdbId;

    // Dacă ai IMDb ID, trebuie convertit în TMDB ID
    // Pentru simplitate, exemplul folosește tmdbId direct
    const id = tmdbId || imdbId;

    if (!id) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing tmdbId or imdb parameter' 
        });
    }

    console.log(`[${new Date().toISOString()}] Extracting for: ${id}`);

    try {
        // Apelează scraper-ul (fără browser!)
        const result = await scrapeVidsrc(id, 'movie');

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

// Endpoint pentru rădăcină
app.get('/', (req, res) => {
    res.json({ 
        message: 'M3U8 Proxy is running. Use /extract?tmdbId=27205' 
    });
});

app.listen(port, () => {
    console.log(`[${new Date().toISOString()}] Proxy running on port ${port}`);
});
