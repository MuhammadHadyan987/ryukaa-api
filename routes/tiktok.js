import express from 'express';
import { getJson } from '../utils/fetcher.js';
import { errorRes, okRes } from '../utils/responders.js';

const router = express.Router();

// GET /api/tiktok?url=...
router.get('/', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return errorRes(res, 400, 'url wajib');

    const proxy = process.env.TT_API_PROXY || 'https://api.tiklydown.eu.org/api/download?url=';
    const api = proxy + encodeURIComponent(url);

    try {
      const data = await getJson(api);
      return okRes(res, { source: 'third-party-proxy', data });
    } catch (err2) {
      console.error('TT proxy fetch error', err2?.message || err2);
      return errorRes(res, 502, 'gagal_mengambil_dari_proxy');
    }
  } catch (err) {
    console.error('TT error', err);
    return errorRes(res, 500, err?.message || 'server_error');
  }
});

export default router;
