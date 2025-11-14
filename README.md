# Ryuka-API (Free, Railway-ready)

This project is a small multi-tool API with **free** implementations that **do not require API keys**.
It is designed to be deployed on Railway (or any Node.js host).

## Included endpoints (no API keys)
- `GET /` health
- `POST /api/ai-chat` { prompt }  — simple rule-based chat (no external API)
- `POST /api/ai-image` { prompt } — returns a generated placeholder image URL (via placeholder service)
- `POST /api/ai-video` { prompt } — returns a free sample video URL (placeholder)
- `GET /api/yt?url=...` — proxy to a free third-party YT downloader (no API key)
- `GET /api/tiktok?url=...` — proxy to a free TikTok downloader
- `GET /api/instagram?url=...` — proxy to a free Instagram downloader
- `GET /api/facebook?url=...` — placeholder (example)

## Quick start (local)
1. `npm install`
2. `cp .env.example .env`
3. `npm run dev` (requires nodemon) or `npm start`
4. Open `http://localhost:3000`

## Deploy to Railway
1. Push repo to GitHub.
2. On Railway, create a new project from GitHub and choose this repo.
3. Railway will run `npm start`.

## Notes & next steps
- These endpoints are intentionally keyless and basic. For production AI/image/video generation consider integrating paid or key-required providers.
- Downloaders depend on third-party public proxies; reliability depends on those services.
