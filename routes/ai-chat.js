import express from 'express';
import { errorRes, okRes } from '../utils/responders.js';

const router = express.Router();

// Simple rule-based chat (no external API). POST { prompt: "..." }
router.post('/', async (req, res) => {
  try {
    const prompt = (req.body.prompt || req.query.prompt || '').toString().trim();
    if (!prompt) return errorRes(res, 400, 'prompt wajib');

    // Very simple deterministic responses to simulate chat:
    const lower = prompt.toLowerCase();
    let reply = "Maaf, aku belum mengerti. Coba tanya hal lain.";

    if (lower.includes('halo') || lower.includes('hi') || lower.includes('hello')) {
      reply = 'Halo! Ada yang bisa saya bantu hari ini?';
    } else if (lower.includes('siapa kamu') || lower.includes('who are you')) {
      reply = 'Saya Ryuka-API, asisten virtual ringan tanpa koneksi ke layanan eksternal.';
    } else if (lower.includes('tolong') || lower.includes('bantu')) {
      reply = 'Tentu, jelaskan masalahmu secara singkat.';
    } else if (lower.includes('?')) {
      reply = 'Itu pertanyaan yang bagus — sayangnya saya hanya bot sederhana yang memberikan jawaban generik.';
    } else {
      // Echo with small transformation
      reply = `Kamu bilang: "${prompt}" — maaf saya hanya bot sederhana.`;
    }

    return okRes(res, { prompt, response: reply });
  } catch (err) {
    console.error('AI Chat error', err);
    return errorRes(res, 500, err?.message || 'server_error');
  }
});

export default router;
