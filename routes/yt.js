// FILE: src/routes/youtube.js
const express = require('express');
const ytdl = require('ytdl-core');

const router = express.Router();

// GET /api/youtube?url=YOUTUBE_URL
// Mengembalikan metadata + daftar formats (info)
router.get('/', async (req, res) => {
  const url = (req.query.url || '').toString();
  if (!url) return res.status(400).json({ status: false, message: 'url wajib' });

  try {
    // normalize & validate
    const isValid = ytdl.validateURL(url) || ytdl.validateID(url);
    if (!isValid) return res.status(400).json({ status: false, message: 'URL YouTube tidak valid' });

    const info = await ytdl.getInfo(url);

    // map formats yang berguna (hindari mengirim terlalu banyak data)
    const formats = info.formats
      .filter(f => f.hasVideo || f.hasAudio) // hanya formats yg ada audio/video
      .map(f => ({
        itag: f.itag,
        container: f.container,
        qualityLabel: f.qualityLabel || null,
        bitrate: f.bitrate || null,
        audioBitrate: f.audioBitrate || null,
        mimeType: f.mimeType,
        approxDurationMs: f.approxDurationMs || info.videoDetails.lengthSeconds * 1000,
        contentLength: f.contentLength || null,
        url: null // jangan kirim URL langsung (bisa panjang); user bisa minta download dengan itag
      }));

    return res.json({
      status: true,
      videoDetails: {
        title: info.videoDetails.title,
        author: info.videoDetails.author?.name,
        lengthSeconds: info.videoDetails.lengthSeconds,
        thumbnails: info.videoDetails.thumbnails
      },
      formats
    });
  } catch (err) {
    console.error('YT INFO ERROR:', err?.message || err);
    return res.status(500).json({ status: false, message: 'gagal_mengambil_info', error: err?.message });
  }
});

// GET /api/youtube/download?url=...&itag=XXXX
// Streams the selected format to client (video or audio)
router.get('/download', async (req, res) => {
  const url = (req.query.url || '').toString();
  const itag = req.query.itag ? Number(req.query.itag) : null;

  if (!url) return res.status(400).json({ status: false, message: 'url wajib' });

  try {
    // validate url
    const isValid = ytdl.validateURL(url) || ytdl.validateID(url);
    if (!isValid) return res.status(400).json({ status: false, message: 'URL YouTube tidak valid' });

    // Ambil info supaya bisa menentukan file name
    const info = await ytdl.getInfo(url);
    const titleSafe = info.videoDetails.title.replace(/[<>:"/\\|?*]+/g, '').slice(0, 120);

    // Pilih stream options
    const options = {};
    if (itag) options.quality = itag; // ytdl-core menerima itag sebagai quality

    // Set headers (content-type akan ditentukan oleh container)
    // Kita akan set content-disposition sebagai attachment sehingga browser mendownload
    res.setHeader('Cache-Control', 'private, no-transform, no-store, must-revalidate');
    res.setHeader('Content-Disposition', `attachment; filename="${titleSafe}.mp4"`);

    // Create stream
    const stream = ytdl(url, {
      ...options,
      highWaterMark: 1 << 25, // 32MB - buat streaming lebih stabil
      requestOptions: {
        headers: {
          // user-agent standar browser agar tidak mudah diblok
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    });

    // Error handling on stream
    stream.on('error', (err) => {
      console.error('YTDL STREAM ERROR:', err?.message || err);
      if (!res.headersSent) {
        res.status(500).json({ status: false, message: 'gagal_stream', error: err?.message });
      } else {
        // If headers already sent, just destroy
        try { stream.destroy(); } catch(e){}
      }
    });

    // When format is chosen, we can set proper content-type if available
    stream.on('info', (info, format) => {
      // format.container is like 'mp4' or 'webm'
      const mime = format.mimeType ? format.mimeType.split(';')[0] : null;
      if (mime && !res.headersSent) {
        res.setHeader('Content-Type', mime);
      }
    });

    // Pipe stream to response
    stream.pipe(res);

  } catch (err) {
    console.error('YT DOWNLOAD ERROR:', err?.message || err);
    // kalau headers belum dikirim, kirim JSON error
    if (!res.headersSent) {
      return res.status(500).json({ status: false, message: 'gagal_download', error: err?.message });
    }
  }
});

module.exports = router;
