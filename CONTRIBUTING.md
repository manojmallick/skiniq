# Contributing to SkinIQ

Thanks for your interest in SkinIQ — the open-source personalised skin intelligence engine powered by Perfect Corp AI.

## Getting Started

1. **Fork** the repository: [github.com/manojmallick/skiniq](https://github.com/manojmallick/skiniq)
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/skiniq.git`
3. **Install dependencies**: `npm install`
4. **Configure**: `cp .env.example .env` and add your API keys
5. **Run**: `npm run dev` — frontend on :5173, API on :3001

## API Keys Needed

| Key | Where to get | Cost |
|-----|-------------|------|
| `YOUCAM_API_KEY` | [yce.perfectcorp.com](https://yce.perfectcorp.com) — redeem code `Pegasus1000` | 1000 free units |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) | Free tier available |

## Ways to Contribute

- 🎨 Add more Perfect Corp APIs (Makeup VTO, Hair Color VTO, Lip Color VTO)
- 🛍 Build real product catalogue integration (e.g. Open Beauty Facts API)
- 📈 Add skin concern trend tracking over time (localStorage, no server storage)
- 🌍 Add multilingual support (Dutch, Hindi, French, Spanish)
- 📱 Improve mobile camera capture UX
- 🧪 Write unit tests for the API parsing layer

## Good First Issues

See issues labelled [`good first issue`](https://github.com/manojmallick/skiniq/labels/good%20first%20issue) on GitHub.

## Privacy Rule (Non-Negotiable)

**Never log, store, or cache user photos.** The `STORE_USER_IMAGES=false` flag is not optional.
Any PR that introduces image storage will be rejected. GDPR compliance is a core feature, not a setting.

## Code Style

- No linting config — just be consistent with surrounding code
- Components in `src/components/`, one file per component
- API handlers in `api/`, one file per endpoint
- Environment variables: always document new ones in `.env.example`

## Pull Request Process

1. Create a branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test locally with `npm run dev`
4. Submit PR with a clear description of what changed and why
