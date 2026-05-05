require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages, skinContext, locale = 'en' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Build the system instructions from the skin context
    const systemPrompt = `You are an expert, empathetic dermatologist and skincare consultant.
Your patient has just received a digital skin analysis and a recommended routine.
They are asking follow-up questions. Answer concisely (max 3 short paragraphs), kindly, and professionally.
If they ask about specific products, lifestyle, or diet, provide actionable, safe advice. Do not provide medical diagnoses.
RESPOND IN THE LANGUAGE FOR LOCALE: ${locale}

PATIENT SKIN CONTEXT:
- Overall Skin Score: ${skinContext?.overallScore ?? 'Unknown'}/100
- Estimated Skin Age: ${skinContext?.skinAge ?? 'Unknown'}
- Top Concerns: ${JSON.stringify(skinContext?.topConcerns || [])}
- Recommended Routine: ${JSON.stringify(skinContext?.routine || {})}
`;

    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      systemInstruction: systemPrompt
    });

    // Extract the latest message
    const lastMessage = messages[messages.length - 1];
    
    // Map previous messages to Gemini history format
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Gemini requires history to start with a 'user' role
    while (history.length > 0 && history[0].role === 'model') {
      history.shift();
    }

    const chat = model.startChat({ history });

    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    return res.status(200).json({ response: text });
  } catch (error) {
    console.error('[chat] Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
