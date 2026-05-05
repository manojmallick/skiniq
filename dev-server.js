// dev-server.js — Local development API server
// Mirrors the Vercel serverless functions in /api/ for local development
// Run: node dev-server.js (or via `npm run dev` with concurrently)

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Import handlers (Vercel serverless function format)
const analyseHandler = require('./api/analyse');
const recommendHandler = require('./api/recommend');

// Mount API routes — adapt req/res to match Vercel serverless signature
app.post('/api/analyse', (req, res) => analyseHandler(req, res));
app.post('/api/recommend', (req, res) => recommendHandler(req, res));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SkinIQ API',
    version: '1.0.0',
    env: {
      youcam: !!process.env.YOUCAM_API_KEY ? 'configured' : 'MISSING',
      gemini: !!process.env.GEMINI_API_KEY ? 'configured' : 'MISSING'
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n🧴 SkinIQ API server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   YouCam API key: ${process.env.YOUCAM_API_KEY ? '✅ configured' : '❌ MISSING — add to .env'}`);
  console.log(`   Gemini API key: ${process.env.GEMINI_API_KEY ? '✅ configured' : '❌ MISSING — add to .env'}`);
  console.log(`\n   Frontend proxy: http://localhost:5173/api/* → http://localhost:${PORT}/api/*\n`);
});
