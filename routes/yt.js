import express from 'express';
import { getJson } from '../utils/fetcher.js';
import { errorRes, okRes } from '../utils/responders.js';

const router = express.Router();

// GET /api/yt?url=...&type=mp4|mp3
router.get('/', async (req, res) => {
  try {
    const url = req.query.url;
    const type = (req.query.type || 'mp4').toLowerCase();
    if (!url) return errorRes(res, 400, 'url wajib');

    // Use a free public proxy/downloader (no API key). Reliability depends on the third-party service.
    const proxyBase = process.env.YT_API_PROXY || 'https://fastrestapis.fasturl.cloud/downup/';
    const endpoint = type === 'mp3' ? 'ytmp3?url=' : 'ytmp4?url=';
    const api = proxyBase + endpoint + encodeURIComponent(url);

    try {
      const data = await getJson(api);
      return okRes(res, { source: 'third-party-proxy', data });
    } catch (err2) {
      console.error('YT proxy fetch error', err2?.message || err2);
      return errorRes(res, 502, 'gagal_mengambil_dari_proxy');
    }
  } catch (err) {
    console.error('YT error', err);
    return errorRes(res, 500, err?.message || 'server_error');
  }
});

export default router;
