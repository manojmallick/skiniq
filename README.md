# SkinIQ — Personalised Skin Intelligence + Commerce

> **Your skin. Analysed. Healed. Shopped.**

Upload a selfie → get a clinical-grade analysis of 14 skin concerns → see what your skin could look like after treatment → get personalised product recommendations. **Free. 30 seconds.**

Powered by [Perfect Corp YouCam AI](https://yce.perfectcorp.com) · Built for the Perfect Corp x Startup World Cup Hackathon 2026.

---

## 🎯 What It Does

| Step | What Happens |
|------|-------------|
| 📸 **Upload** | User uploads a selfie (no filters, good lighting) |
| 🔬 **Analyse** | Perfect Corp Skin Analysis API scores 14 concerns (acne, wrinkles, spots, oiliness...) |
| ✨ **Simulate** | Perfect Corp Skin Simulation API generates a healed before/after visual |
| 🛍 **Shop** | Gemini AI recommends personalised ingredients matched to the user's exact scores |

## 🧬 APIs Used

- **[Perfect Corp Skin Analysis API](https://docs.perfectcorp.com)** — 14 skin concerns, clinical-grade scoring, GDPR/HIPAA/CCPA compliant, validated by dermatologists, trained on 70,000 medical-grade images
- **[Perfect Corp Skin Simulation API](https://docs.perfectcorp.com)** — generates before/after healed skin visuals for up to 10 skin concerns
- **[Google Gemini API](https://aistudio.google.com)** — personalised product ingredient recommendations grounded in skin concern scores

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- YouCam API key (from [yce.perfectcorp.com](https://yce.perfectcorp.com) — redeem code `Pegasus1000` for free credits)
- Gemini API key (from [aistudio.google.com](https://aistudio.google.com))

### Setup

```bash
git clone https://github.com/manojmallick/skiniq.git
cd skiniq

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your YOUCAM_API_KEY and GEMINI_API_KEY

# Run (frontend + API server)
npm run dev
```

Frontend: http://localhost:5173  
API server: http://localhost:3001  
Health check: http://localhost:3001/health

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
# Set environment variables in Vercel dashboard
```

## 📁 Project Structure

```
skiniq/
├── api/
│   ├── analyse.js        # POST /api/analyse — Skin Analysis + Simulation pipeline
│   └── recommend.js      # POST /api/recommend — Gemini product recommendations
├── src/
│   ├── App.jsx            # Screen state machine
│   ├── components/
│   │   ├── UploadScreen.jsx      # Photo upload
│   │   ├── AnalysisScreen.jsx    # 14 concern scores
│   │   ├── SimulationScreen.jsx  # Before/after slider + products
│   │   ├── SkinScoreBar.jsx      # Animated score bar
│   │   └── LoadingState.jsx      # Step-specific loading
│   ├── services/api.js    # Frontend API layer
│   └── styles/globals.css # Design system
├── dev-server.js          # Local dev API server
├── vercel.json            # Deployment config
└── .env.example           # Environment template
```

## 🔒 Privacy

- **No user images are stored.** Photos are processed in memory and immediately discarded after the API call.
- GDPR, HIPAA, and CCPA compliant by design (enforced by the Perfect Corp API).
- `STORE_USER_IMAGES=false` is hardcoded as default.

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues welcome — especially for the items in our [roadmap](https://github.com/manojmallick/skiniq/issues).

## 📄 License

MIT — built by [Manoj Mallick](https://github.com/manojmallick), Amsterdam 🇳🇱
