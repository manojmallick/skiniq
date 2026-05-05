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

async function generateRecommendations(scores, topConcerns, skinType) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

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

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "summary": "2 sentences max. Personalised summary of their skin health. Start with a positive. Then name the key concern area. Warm, clinical tone.",
  "skinAge": <number: estimated skin age based on firmness/wrinkles/spots scores. If scores are high, estimate younger than 30. Be encouraging but realistic.>,
  "recommendations": [
    {
      "concern": "<concern name>",
      "concernId": "<id>",
      "score": <score>,
      "productType": "<product type e.g. Vitamin C Serum>",
      "keyIngredient": "<ingredient e.g. L-Ascorbic Acid 15%>",
      "explanation": "<one sentence why this helps>",
      "usageHint": "<when/how to apply>",
      "severity": "<high|medium|low>",
      "timeOfDay": "<AM|PM|both>"
    }
  ],
  "routine": {
    "am": ["<step 1>", "<step 2>", "<step 3>", "<step 4>"],
    "pm": ["<step 1>", "<step 2>", "<step 3>", "<step 4>"]
  }
}`;

  console.log('[recommend] Calling Gemini for recommendations + summary + routine...');
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  let cleanText = text;
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
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

  const { scores, topConcerns, skinType } = req.body;

  if (!scores || !topConcerns || !Array.isArray(topConcerns) || topConcerns.length === 0) {
    return res.status(400).json({ error: 'Missing scores or topConcerns in request body' });
  }

  try {
    const result = await generateRecommendations(scores, topConcerns.slice(0, 3), skinType);

    // Fetch real product images from Open Beauty Facts
    const recommendations = result.recommendations || [];
    for (let rec of recommendations) {
      const searchTerms = [rec.keyIngredient, rec.productType].filter(Boolean);
      for (const term of searchTerms) {
        try {
          const q = encodeURIComponent(term);
          // Wait briefly to avoid hammering the API if there are many recs
          await new Promise(r => setTimeout(r, 100));
          const response = await fetch(`https://world.openbeautyfacts.org/api/v1/search?search_terms=${q}&json=true`);
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
