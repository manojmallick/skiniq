// api/recommend.js — POST /api/recommend
// Vercel Serverless Function
// Uses Google Gemini to generate personalised product recommendations
// based on skin concern scores from the Skin Analysis API

require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const CONCERN_LABELS = {
  hd_wrinkle:     'Wrinkles',
  hd_pore:        'Pore Size',
  hd_texture:     'Skin Texture',
  hd_acne:        'Acne & Blemishes',
  hd_oiliness:    'Oiliness',
  hd_radiance:    'Radiance',
  hd_dark_circle: 'Dark Circles',
  hd_redness:     'Redness',
  hd_moisture:    'Moisture',
  hd_firmness:    'Firmness',
  hd_age_spot:    'Dark Spots',
  hd_eye_bag:     'Eye Bags',
  hd_tear_trough: 'Tear Trough',
  hd_skin_type:   'Skin Type'
};

async function generateRecommendations(scores, topConcerns, skinType, locale = 'en') {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json" }
  });

  const scoreLines = topConcerns.map(id => {
    const s = scores[id];
    return `- ${CONCERN_LABELS[id] || id}: ${s?.score ?? '?'}/100`;
  }).join('\n');

  const allScoreLines = Object.values(scores)
    .sort((a, b) => b.score - a.score)
    .map(s => `${s.label}: ${s.score}/100`)
    .join(', ');

  const skinTypeLabel = skinType ? `Skin type: ${skinType}` : '';

  const prompt = `You are a professional dermatologist and skincare expert.

A patient's skin analysis results:
${skinTypeLabel}
All scores (higher = healthier): ${allScoreLines}

Top 3 concerns needing the most attention:
${scoreLines}

Respond ONLY with valid JSON (no markdown, no code fences).
IMPORTANT: You MUST write the 'summary', 'explanation', 'usageHint', and 'routine' steps in the language corresponding to this ISO locale code: ${locale}.
However, the 'keyIngredient' and 'productType' MUST remain in English for our product search API to work.

Use this EXACT JSON format (replace the ellipsis and numbers with your generated content):
{
  "summary": "...",
  "skinAge": 28,
  "recommendations": [
    {
      "concern": "...",
      "concernId": "...",
      "score": 45,
      "productType": "...",
      "keyIngredient": "...",
      "explanation": "...",
      "usageHint": "...",
      "severity": "...",
      "timeOfDay": "..."
    }
  ],
  "routine": {
    "am": ["...", "..."],
    "pm": ["...", "..."]
  }
}`;

  console.log('[recommend] Calling Gemini for recommendations + summary + routine...');
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  let cleanText = text;
  const startIdx = cleanText.indexOf('{');
  const endIdx = cleanText.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1) {
    cleanText = cleanText.substring(startIdx, endIdx + 1);
  }

  return JSON.parse(cleanText);
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GEMINI_API_KEY) {
    console.error('[recommend] GEMINI_API_KEY not configured');
    return res.status(500).json({ error: 'Gemini API key not configured. Add GEMINI_API_KEY to .env' });
  }

  const { scores, topConcerns, skinType, locale } = req.body;

  if (!scores || !topConcerns || !Array.isArray(topConcerns) || topConcerns.length === 0) {
    return res.status(400).json({ error: 'Missing scores or topConcerns in request body' });
  }

  try {
    const result = await generateRecommendations(scores, topConcerns.slice(0, 3), skinType, locale);

    // Fetch real product images from Open Beauty Facts
    const recommendations = result.recommendations || [];
    for (let rec of recommendations) {
      const searchTerms = [rec.keyIngredient, rec.productType].filter(Boolean);
      for (const term of searchTerms) {
        try {
          const q = encodeURIComponent(term);
          // Wait briefly to avoid hammering the API if there are many recs
          await new Promise(r => setTimeout(r, 100));
          const response = await fetch(`https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1`);
          const data = await response.json();
          const validProduct = data.products?.find(p => p.product_name && p.image_url);
          if (validProduct) {
            rec.actualProduct = {
              name: validProduct.product_name,
              brand: validProduct.brands || 'Unknown Brand',
              image: validProduct.image_front_small_url || validProduct.image_url,
              url: validProduct.url || `https://world.openbeautyfacts.org/product/${validProduct._id}`
            };
            break; // found one!
          }
        } catch (e) {
          console.error(`[recommend] Open Beauty API error for ${term}:`, e.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      recommendations,
      summary: result.summary || null,
      skinAge: result.skinAge || null,
      routine: result.routine || null
    });

  } catch (error) {
    console.error('[recommend] Error:', error);
    return res.status(500).json({
      error: 'Could not generate recommendations. Please try again.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
