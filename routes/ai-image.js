import express from 'express';
import { errorRes, okRes } from '../utils/responders.js';

const router = express.Router();

// Create a placeholder image URL using via.placeholder.com (no API keys)
// POST { prompt }
router.post('/', async (req, res) => {
  try {
    const prompt = (req.body.prompt || req.query.prompt || '').toString().trim();
    if (!prompt) return errorRes(res, 400, 'prompt wajib');

    // Build a placeholder image with encoded prompt in text (max length trimmed)
    const label = encodeURIComponent(prompt.slice(0, 60));
    const url = `https://via.placeholder.com/1024x1024.png?text=${label}`;

    return okRes(res, { prompt, image: url });
  } catch (err) {
    console.error('AI Image error', err);
    return errorRes(res, 500, err?.message || 'server_error');
  }
});

export default router;
