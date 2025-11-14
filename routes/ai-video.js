import express from 'express';
import { errorRes, okRes } from '../utils/responders.js';

const router = express.Router();

// Placeholder video endpoint: returns a free sample video URL (no API keys)
// POST { prompt }
router.post('/', async (req, res) => {
  try {
    const prompt = (req.body.prompt || req.query.prompt || '').toString().trim();
    if (!prompt) return errorRes(res, 400, 'prompt wajib');

    // Use a small public sample video (free sample). This is just a placeholder.
    const sample = 'https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_1mb.mp4';
    return okRes(res, { prompt, video: sample, note: 'This is a placeholder sample video. For real AI video generation, integrate a video generation service.' });
  } catch (err) {
    console.error('AI Video error', err);
    return errorRes(res, 500, err?.message || 'server_error');
  }
});

export default router;
