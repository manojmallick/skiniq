// api/makeup.js — POST /api/makeup
// Vercel Serverless Function
// Triggers the Perfect Corp Virtual Try-On API to apply makeup

require('dotenv').config();

const YOUCAM_API_KEY = process.env.YOUCAM_API_KEY;
const YOUCAM_BASE_URL = process.env.YOUCAM_BASE_URL || 'https://yce-api-01.makeupar.com';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'app_id': YOUCAM_API_KEY,
    'app_key': YOUCAM_API_KEY,
    'Accept': 'application/json'
  };
}

async function createMakeupTask(fileId) {
  const endpoint = `${YOUCAM_BASE_URL}/s2s/v2.1/task/makeup`;
  const body = {
    src_file_id: fileId,
    effects: [
      {
        type: "lipstick",
        color: {
          hex: "#E3242B" // Signature Red
        }
      }
    ]
  };

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Makeup task creation failed ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  const taskId = data.data?.task_id;
  if (!taskId) throw new Error(`No task_id in makeup response: ${JSON.stringify(data)}`);
  
  return taskId;
}

async function pollTask(taskId, maxWaitMs = 45000, intervalMs = 1500) {
  const endpoint = `${YOUCAM_BASE_URL}/s2s/v2.1/task/makeup/${taskId}`;
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const resp = await fetch(endpoint, { method: 'GET', headers: authHeaders() });
    if (!resp.ok) throw new Error(`Poll makeup HTTP ${resp.status}`);
    const data = await resp.json();
    const taskData = data.data || {};
    const status = taskData.task_status;

    if (status === 'success') return taskData;
    if (status === 'error') {
      throw new Error(`Makeup task error: ${taskData.error_message || taskData.error}`);
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error('Task timed out');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!YOUCAM_API_KEY) return res.status(500).json({ error: 'YOUCAM_API_KEY not configured' });

  const { fileId } = req.body;
  if (!fileId) return res.status(400).json({ error: 'Missing fileId' });

  try {
    const taskId = await createMakeupTask(fileId);
    const taskData = await pollTask(taskId);
    
    // Parse the result
    const results = taskData.results || {};
    const image = results.healed_image || results.output_image || results.result_image || results.dst_image || results.image_url || results.url || results.output?.[0]?.image_url || results.output?.[0]?.url || results.output?.[0]?.dst_image || null;

    return res.status(200).json({ success: true, makeupImage: image });
  } catch (error) {
    console.error('[makeup] Error:', error);
    return res.status(500).json({ error: 'Failed to apply makeup.', detail: error.message });
  }
};
