# SkinIQ GitHub Issues — Copy-Paste Ready
# Open these at: https://github.com/manojmallick/skiniq/issues/new

---

## Issue 1: Makeup VTO Integration (Perfect Corp Makeup Try-On API)

**Title:** feat: Add Makeup Virtual Try-On using Perfect Corp Makeup VTO API

**Labels:** enhancement, good first issue

**Body:**
> Currently SkinIQ uses the Skin Analysis and Skin Simulation APIs. Perfect Corp also offers a Makeup VTO (Virtual Try-On) API that allows users to virtually try lipstick, foundation, blush and eyeshadow in real-time.
>
> **Proposed feature:** After skin analysis, offer a "Try Recommended Products" flow that uses the Makeup VTO API to overlay the recommended foundation shade and lip colour on the user's selfie.
>
> **API:** `POST /s2s/v2.1/task/makeup`  
> **Relevant docs:** https://docs.perfectcorp.com/develop/makeup-vto
>
> **Acceptance criteria:**
> - [ ] User can select a foundation shade from 3 AI-recommended options
> - [ ] Makeup VTO renders on the analysed selfie
> - [ ] User can toggle between "natural" and "corrective" makeup looks

---

## Issue 2: Real Product Catalogue Integration (Open Beauty Facts)

**Title:** feat: Link AI ingredient recommendations to real purchasable products

**Labels:** enhancement, good first issue

**Body:**
> Currently Gemini recommends ingredients (e.g. "Salicylic Acid 2%") but doesn't link to real products. We should integrate the Open Beauty Facts API to match recommended ingredients to actual products with prices and links.
>
> **API:** `GET https://world.openbeautyfacts.org/cgi/search.pl?search_terms={ingredient}`
>
> **Acceptance criteria:**
> - [ ] Each product recommendation card shows 1-2 real product matches
> - [ ] Product name, brand, and ingredient list shown
> - [ ] External link to purchase (Amazon, INCI Beauty)

---

## Issue 3: Skin Score History (localStorage Trend Tracking)

**Title:** feat: Track skin score improvements over time using localStorage

**Labels:** enhancement

**Body:**
> Users should be able to track whether their skin is improving. After each analysis, save the overall score and top concern scores to localStorage. Show a mini trend chart on the upload screen for returning users.
>
> **Implementation:**
> - `localStorage.setItem('skiniq_history', JSON.stringify([{date, overallScore, scores}]))`
> - Display last 5 results as a sparkline chart using SVG (no library needed)
>
> **Acceptance criteria:**
> - [ ] Scores saved after each successful analysis
> - [ ] "Your Progress" card visible on upload screen for returning users
> - [ ] Trend arrow (↑ Improving / → Stable / ↓ Declining) next to overall score

---

## Issue 4: PDF Skin Report Export

**Title:** feat: Download personalised skin report as PDF

**Labels:** enhancement

**Body:**
> Users should be able to download a branded PDF of their skin analysis for sharing with a dermatologist or personal reference.
>
> **Implementation:** Use `jsPDF` + `html2canvas` to screenshot the analysis + simulation screen and export as a formatted PDF with the SkinIQ logo, scores, and product recommendations.
>
> **Acceptance criteria:**
> - [ ] "Download Report" button on simulation screen
> - [ ] PDF includes: overall score, concern scores, AI summary, product recs, routine
> - [ ] File named `SkinIQ-Report-{date}.pdf`

---

## Issue 5: Multi-language Support (NL / IN / FR)

**Title:** feat: Add multilingual support — Dutch, Hindi, French

**Labels:** enhancement, good first issue

**Body:**
> SkinIQ is built in Amsterdam and targeting a global hackathon. Support at least Dutch (NL), Hindi (IN), and French (FR) in addition to English.
>
> **Implementation:**
> - Add a `src/i18n/` directory with locale JSON files
> - Use React context for current locale
> - Auto-detect from `navigator.language`
> - Gemini prompt should include `Respond in ${locale}` for AI summary and recommendations
>
> **Acceptance criteria:**
> - [ ] Language switcher in header (🌍 icon)
> - [ ] All static UI text translated
> - [ ] Gemini AI summary and product recs returned in selected language
