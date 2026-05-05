# Changelog

All notable changes to SkinIQ are documented here.

## [1.0.0] — 2026-05-07 (Hackathon Submission)

### Added
- **Skin Analysis** — Perfect Corp Skin Analysis API integration, 14 skin concerns scored 0-100
- **Skin Simulation** — Perfect Corp Skin Simulation API, before/after healed skin visualisation
- **Before/After Slider** — Draggable comparison slider (mouse + touch), the centrepiece UI moment
- **Product Recommendations** — Google Gemini AI generates personalised ingredient recommendations matched to concern scores
- **Upload Screen** — Drag & drop + click-to-upload, image preview, tips, trust badges
- **Analysis Screen** — 14 animated score bars (green/amber/coral), overlay image, overall score circle
- **Simulation Screen** — Before/after slider + 3 product recommendation cards
- **Loading States** — Step-specific microcopy for analysis, simulation, and recommendations steps
- **GDPR Compliance** — No user image storage, no server-side persistence, privacy-first by design
- **Responsive Design** — Mobile-first, tested at 390px (iPhone 15 Pro)
- **Open Source** — MIT licence, CONTRIBUTING.md, GitHub Issues roadmap

### Technical
- React 18 + Vite frontend
- Vercel Serverless Functions backend (`/api/`)
- Google Gemini 1.5 Flash for product recommendation generation
- Node.js + Express dev server for local development
- CSS design system (Inter, clinical colour palette)

## [Unreleased] — Roadmap

### Planned
- Makeup VTO integration (Perfect Corp Makeup VTO API)
- Real product catalogue (Open Beauty Facts API)
- Skin score trend tracking (localStorage)
- Dutch / Hindi / French localisation
- Hair & beard analysis extension (Perfect Corp Hair APIs)
- PDF report export
