import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiChatRouter from './routes/ai-chat.js';
import aiImageRouter from './routes/ai-image.js';
import aiVideoRouter from './routes/ai-video.js';
import ytRouter from './routes/yt.js';
import ttRouter from './routes/tiktok.js';
import igRouter from './routes/instagram.js';
import fbRouter from './routes/facebook.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.json({ status: 'ok', name: 'ryuka-api' }));

app.use('/api/ai-chat', aiChatRouter);
app.use('/api/ai-image', aiImageRouter);
app.use('/api/ai-video', aiVideoRouter);
app.use('/api/yt', ytRouter);
app.use('/api/tiktok', ttRouter);
app.use('/api/instagram', igRouter);
app.use('/api/facebook', fbRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Ryuka-API listening on ${PORT}`));
