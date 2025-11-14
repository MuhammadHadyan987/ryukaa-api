// ==========================================
// FILE: src/index.js (Main Server)
// ==========================================
const express = require('express');
const cors = require('cors');
const youtubeRoutes = require('./routes/youtube');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'YouTube API Running on Railway',
        version: '1.0.0',
        endpoints: {
            'GET /api/youtube': 'Get YouTube video info',
            'GET /api/youtube/search': 'Search YouTube videos (coming soon)',
            'GET /health': 'Health check'
        },
        documentation: 'https://github.com/yourusername/yt-api'
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

// Mount YouTube routes
app.use('/api/youtube', youtubeRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        status: false,
        message: 'Endpoint not found',
        path: req.path
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        status: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});


// ==========================================
// FILE: src/routes/youtube.js
// ==========================================
const express = require('express');
const axios = require('axios');
const { getCache, setCache } = require('../utils/cache');

const router = express.Router();

// Cache TTL (5 menit)
const CACHE_TTL = 5 * 60 * 1000;

// Multiple proxy endpoints (fallback)
const PROXIES = [
    'https://fastrestapis.fasturl.cloud/downup/ytmp4?url=',
    'https://api.allorigins.win/raw?url=',
    'https://proxify-d.vercel.app/api?url='
];

// GET /api/youtube?url=xxx
router.get('/', async (req, res) => {
    const { url } = req.query;

    // Validasi URL
    if (!url) {
        return res.status(400).json({
            status: false,
            message: "Parameter 'url' wajib diisi",
            example: "/api/youtube?url=https://youtube.com/watch?v=VIDEO_ID"
        });
    }

    // Validasi format YouTube
    if (!isValidYouTubeUrl(url)) {
        return res.status(400).json({
            status: false,
            message: "URL bukan YouTube yang valid",
            received: url,
            supported: [
                "https://youtube.com/watch?v=...",
                "https://youtu.be/...",
                "https://youtube.com/shorts/..."
            ]
        });
    }

    try {
        // Clean URL
        const cleanUrl = cleanYouTubeUrl(url);
        const cacheKey = `yt:${cleanUrl}`;

        // Cek cache
        const cached = getCache(cacheKey);
        if (cached) {
            return res.json({
                status: true,
                data: cached.data,
                cached: true,
                cache_age: `${Math.floor((Date.now() - cached.timestamp) / 1000)}s`,
                url: cleanUrl
            });
        }

        // Fetch dari proxy dengan fallback
        const result = await fetchWithFallback(cleanUrl);

        if (!result) {
            throw new Error('Semua proxy gagal');
        }

        // Simpan ke cache
        setCache(cacheKey, {
            data: result,
            timestamp: Date.now()
        }, CACHE_TTL);

        return res.json({
            status: true,
            data: result,
            cached: false,
            url: cleanUrl
        });

    } catch (error) {
        console.error('YouTube API Error:', error.message);

        const errorResponse = {
            status: false,
            message: 'Gagal mengambil info video',
            error: error.message,
            url: url
        };

        // Detail error
        if (error.code === 'ECONNABORTED') {
            errorResponse.reason = 'Timeout - Server proxy terlalu lama';
        } else if (error.response) {
            errorResponse.reason = `Proxy error: ${error.response.status}`;
        } else if (error.request) {
            errorResponse.reason = 'Tidak dapat terhubung ke proxy';
        }

        return res.status(500).json(errorResponse);
    }
});

// Fetch dengan multiple proxy fallback
async function fetchWithFallback(cleanUrl) {
    let lastError = null;

    for (const proxyBase of PROXIES) {
        try {
            const proxyUrl = `${proxyBase}${encodeURIComponent(cleanUrl)}`;
            
            console.log(`Trying proxy: ${proxyBase}`);

            const response = await axios.get(proxyUrl, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (response.data) {
                console.log(`✅ Success with proxy: ${proxyBase}`);
                return response.data;
            }
        } catch (error) {
            lastError = error;
            console.log(`❌ Failed with proxy: ${proxyBase} - ${error.message}`);
            continue;
        }
    }

    throw lastError || new Error('All proxies failed');
}

// Validasi YouTube URL
function isValidYouTubeUrl(url) {
    const patterns = [
        /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\//
    ];
    return patterns.some(pattern => pattern.test(url));
}

// Clean YouTube URL
function cleanYouTubeUrl(url) {
    // Hapus parameter sampah
    let clean = url.split('?')[0];
    
    // Handle youtu.be
    if (clean.includes('youtu.be/')) {
        const videoId = clean.split('youtu.be/')[1].split('?')[0];
        clean = `https://youtube.com/watch?v=${videoId}`;
    }
    
    // Handle shorts
    if (clean.includes('/shorts/')) {
        const videoId = clean.split('/shorts/')[1].split('?')[0];
        clean = `https://youtube.com/watch?v=${videoId}`;
    }
    
    return clean;
}

module.exports = router;


// ==========================================
// FILE: src/utils/cache.js
// ==========================================
// Simple in-memory cache
const cache = new Map();
const MAX_CACHE_SIZE = 100;

function getCache(key) {
    const item = cache.get(key);
    
    if (!item) {
        return null;
    }

    // Check TTL
    if (item.expiresAt && Date.now() > item.expiresAt) {
        cache.delete(key);
        return null;
    }

    return item;
}

function setCache(key, value, ttl = null) {
    // Cleanup old cache if size limit reached
    if (cache.size >= MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
    }

    const item = {
        ...value,
        expiresAt: ttl ? Date.now() + ttl : null
    };

    cache.set(key, item);
}

function clearCache() {
    cache.clear();
}

function getCacheStats() {
    return {
        size: cache.size,
        maxSize: MAX_CACHE_SIZE,
        keys: Array.from(cache.keys())
    };
}

module.exports = {
    getCache,
    setCache,
    clearCache,
    getCacheStats
};


// ==========================================
// FILE: package.json
// ==========================================
/*
{
  "name": "yt-api-railway",
  "version": "1.0.0",
  "description": "YouTube API on Railway",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
*/


// ==========================================
// FILE: .env (untuk local development)
// ==========================================
/*
PORT=3000
NODE_ENV=development
*/
