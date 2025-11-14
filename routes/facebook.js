import express from 'express';
import { getJson } from '../utils/fetcher.js';
import { errorRes, okRes } from '../utils/responders.js';

const router = express.Router();

// GET /api/facebook?url=...
router.get('/', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return errorRes(res, 400, 'url wajib');

    // Placeholder: no reliable free FB downloader proxy guaranteed.
    // Return a friendly message and echo the URL.
    return okRes(res, { note: 'Facebook downloader not implemented as free reliable proxy is not included.', url });
  } catch (err) {
    console.error('FB error', err);
    return errorRes(res, 500, err?.message || 'server_error');
  }
});

export default router;
