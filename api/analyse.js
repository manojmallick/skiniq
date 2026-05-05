// api/analyse.js — POST /api/analyse
// Perfect Corp YouCam API v2.1 — verified against official docs
//
// Flow:
//   1. POST /s2s/v2.1/file/skin-analysis   body: { files: [{ content_type, file_name, file_size }] }
//      Response: { data: { files: [{ file_id, requests: [{ url, method, headers }] }] } }
//   2. PUT {requests[0].url}                with raw binary image + Content-Type header
//   3. POST /s2s/v2.1/task/skin-analysis   body: { src_file_id, dst_actions: [...], format: "json" }
//      Response: { data: { task_id } }
//   4. GET  /s2s/v2.1/task/skin-analysis/{task_id}
//      Response (success): { data: { task_status: "success", results: { output: [{ type, raw_score, ui_score, mask_urls }] } } }
//   5. Same pattern for skin-simulation

require('dotenv').config();

const YOUCAM_API_KEY = process.env.YOUCAM_API_KEY;
const YOUCAM_BASE_URL = (process.env.YOUCAM_BASE_URL || 'https://yce-api-01.makeupar.com').replace(/\/$/, '');

// All supported dst_actions for HD Skin Analysis (from official docs)
const ALL_DST_ACTIONS = [
  'hd_wrinkle', 'hd_pore', 'hd_texture', 'hd_acne',
  'hd_oiliness', 'hd_radiance', 'hd_dark_circle', 'hd_redness',
  'hd_moisture', 'hd_firmness', 'hd_age_spot', 'hd_eye_bag',
  'hd_droopy_upper_eyelid', 'hd_droopy_lower_eyelid',
  'hd_tear_trough', 'hd_skin_type'
];

// Which concerns the Skin Simulation API can heal
const SIMULATABLE = [
  'hd_wrinkle', 'hd_pore', 'hd_texture', 'hd_acne',
  'hd_oiliness', 'hd_dark_circle', 'hd_redness',
  'hd_moisture', 'hd_age_spot', 'hd_eye_bag'
];

const CONCERN_LABELS = {
  hd_wrinkle:              'Wrinkles',
  hd_pore:                 'Pore Size',
  hd_texture:              'Skin Texture',
  hd_acne:                 'Acne & Blemishes',
  hd_oiliness:             'Oiliness',
  hd_radiance:             'Radiance',
  hd_dark_circle:          'Dark Circles',
  hd_redness:              'Redness',
  hd_moisture:             'Moisture',
  hd_firmness:             'Firmness',
  hd_age_spot:             'Dark Spots',
  hd_eye_bag:              'Eye Bags',
  hd_droopy_upper_eyelid:  'Upper Eyelid',
  hd_droopy_lower_eyelid:  'Lower Eyelid',
  hd_tear_trough:          'Tear Trough',
  hd_skin_type:            'Skin Type'
};

// Concerns where higher score = healthier (moisture, radiance, firmness)
const POSITIVE_CONCERNS = new Set(['hd_moisture', 'hd_radiance', 'hd_firmness']);

const authHeaders = () => ({
  'Authorization': `Bearer ${YOUCAM_API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
});

// ── Step 1: Request a pre-signed upload slot ──────────────────────────────────
async function requestUploadSlot(fileSizeBytes, mimeType, fileName) {
  const endpoint = `${YOUCAM_BASE_URL}/s2s/v2.1/file/skin-analysis`;

  // VERIFIED FORMAT: body must have "files" array
  const body = {
    files: [{
      content_type: mimeType,
      file_name: fileName,
      file_size: fileSizeBytes
    }]
  };

  console.log(`[Upload] POST ${endpoint} — ${fileSizeBytes} bytes, ${mimeType}`);

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`File slot request failed ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  // Response: { status: 200, data: { files: [{ file_id, requests: [{ url, method, headers }] }] } }
  const fileObj = data.data?.files?.[0];
  if (!fileObj?.file_id) {
    throw new Error(`No file_id in upload slot response: ${JSON.stringify(data)}`);
  }

  const uploadRequest = fileObj.requests?.[0];
  if (!uploadRequest?.url) {
    throw new Error(`No presigned URL in upload slot response: ${JSON.stringify(data)}`);
  }

  console.log(`[Upload] Got file_id=${fileObj.file_id}`);
  return {
    fileId: fileObj.file_id,
    uploadUrl: uploadRequest.url,
    uploadHeaders: uploadRequest.headers || {}
  };
}

// ── Step 2: PUT binary image to presigned URL ─────────────────────────────────
async function uploadBinaryImage(uploadUrl, uploadHeaders, imageBuffer) {
  console.log(`[Upload] PUT ${imageBuffer.length} bytes to presigned URL...`);

  const resp = await fetch(uploadUrl, {
    method: 'PUT',
    headers: uploadHeaders,   // use headers exactly as provided by the API
    body: imageBuffer
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Binary upload failed ${resp.status}: ${err}`);
  }

  console.log('[Upload] ✅ Image uploaded successfully');
}

// ── Step 3: Create analysis task ──────────────────────────────────────────────
async function createAnalysisTask(fileId) {
  const endpoint = `${YOUCAM_BASE_URL}/s2s/v2.1/task/skin-analysis`;

  const body = {
    src_file_id: fileId,
    dst_actions: ALL_DST_ACTIONS,
    format: 'json'           // REQUIRED: returns scores in results.output[], not image URLs
  };

  console.log(`[Analysis] POST ${endpoint} with file_id=${fileId}`);

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Analysis task creation failed ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  const taskId = data.data?.task_id;
  if (!taskId) throw new Error(`No task_id in analysis response: ${JSON.stringify(data)}`);

  console.log(`[Analysis] Task created: task_id=${taskId}`);
  return taskId;
}

// ── Step 3b: Create simulation task ──────────────────────────────────────────
async function createSimulationTask(fileId, concernTypes) {
  const endpoint = `${YOUCAM_BASE_URL}/s2s/v2.1/task/skin-simulation`;
  const simulatable = concernTypes.filter(t => SIMULATABLE.includes(t));
  if (simulatable.length === 0) return null;

  const body = {
    src_file_id: fileId,
    dst_actions: simulatable
  };

  console.log(`[Simulation] POST ${endpoint} for: ${simulatable.join(', ')}`);

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.warn(`[Simulation] Task creation failed ${resp.status}: ${err}`);
    return null;
  }

  const data = await resp.json();
  const taskId = data.data?.task_id;
  console.log(`[Simulation] Task created: task_id=${taskId}`);
  return taskId;
}

// ── Step 4: Poll until task_status === "success" ──────────────────────────────
async function pollTask(taskType, taskId, maxWaitMs = 45000, intervalMs = 1500) {
  const endpoint = `${YOUCAM_BASE_URL}/s2s/v2.1/task/${taskType}/${taskId}`;
  const deadline = Date.now() + maxWaitMs;

  console.log(`[Poll] Polling ${taskType}/${taskId}...`);

  while (Date.now() < deadline) {
    const resp = await fetch(endpoint, {
      method: 'GET',
      headers: authHeaders()
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Poll ${taskType} HTTP ${resp.status}: ${err}`);
    }

    const data = await resp.json();
    const taskData = data.data || {};
    const status = taskData.task_status;

    console.log(`[Poll] ${taskType} status=${status}`);

    if (status === 'success') return taskData;

    if (status === 'error') {
      // Log the full error details from the API — this is the key debugging info
      const errorCode = taskData.error || 'unknown_error';
      const errorMsg  = taskData.error_message || 'No error message';
      console.error(`[Poll] ❌ ${taskType} FAILED — code="${errorCode}" message="${errorMsg}"`);
      console.error(`[Poll] Full error response:`, JSON.stringify(taskData, null, 2));
      throw new Error(`${taskType} task error [${errorCode}]: ${errorMsg}`);
    }

    await new Promise(r => setTimeout(r, intervalMs));
  }

  throw new Error(`Task ${taskId} timed out after ${maxWaitMs}ms`);
}


// ── Parse analysis result ─────────────────────────────────────────────────────
// Response shape: { task_status: "success", results: { output: [{ type, raw_score, ui_score, mask_urls }] } }
function parseAnalysisResult(taskData) {
  const output = taskData.results?.output || [];
  const scores = {};

  for (const item of output) {
    const type = item.type;
    if (!type || !CONCERN_LABELS[type]) continue;

    scores[type] = {
      id: type,
      label: CONCERN_LABELS[type],
      score: Math.round(item.ui_score ?? item.raw_score ?? 50),
      rawScore: item.raw_score,
      isPositive: POSITIVE_CONCERNS.has(type),
      maskUrl: item.mask_urls?.[0] || null
    };
  }

  // Overall score: average of all returned scores
  const vals = Object.values(scores).map(s => s.score);
  const overallScore = vals.length > 0
    ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    : 0;

  return { scores, overallScore };
}

// ── Parse simulation result ───────────────────────────────────────────────────
function parseSimulationResult(taskData) {
  // Log full response so we can see the actual shape
  console.log('[Simulation] Full result:', JSON.stringify(taskData, null, 2));
  const results = taskData.results || {};
  console.log('[Simulation] results keys:', Object.keys(results));

  const image =
    results.healed_image         ||
    results.output_image         ||
    results.result_image         ||
    results.dst_image            ||
    results.image_url            ||
    results.url                  ||
    results.output?.[0]?.image_url ||
    results.output?.[0]?.url     ||
    results.output?.[0]?.dst_image ||
    null;

  console.log('[Simulation] healedImage:', image ? image.substring(0, 100) : 'NULL — check Full result above');
  return image;
}

// ── Get 3 worst-scoring simulatable negative concerns ────────────────────────
function getTopConcerns(scores, count = 3) {
  return Object.values(scores)
    .filter(s => SIMULATABLE.includes(s.id) && !POSITIVE_CONCERNS.has(s.id))
    .sort((a, b) => a.score - b.score)  // lowest = worst
    .slice(0, count)
    .map(s => s.id);
}

// ── Main handler ──────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!YOUCAM_API_KEY) {
    return res.status(500).json({ error: 'YOUCAM_API_KEY not configured in .env' });
  }

  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing imageBase64 in request body' });
  }

  // Detect MIME type and strip data URL prefix
  const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
  const mimeType  = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const ext       = mimeType.split('/')[1] || 'jpg';
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');

  if (imageBuffer.length > 15_000_000) {
    return res.status(400).json({ error: 'Image too large. Please use a photo under 15MB.' });
  }

  try {
    // 1 + 2: Upload image to get file_id
    const { fileId, uploadUrl, uploadHeaders } = await requestUploadSlot(
      imageBuffer.length, mimeType, `selfie.${ext}`
    );
    await uploadBinaryImage(uploadUrl, uploadHeaders, imageBuffer);

    // 3: Create analysis + simulation tasks in parallel
    const [analysisTaskId, simulationTaskId] = await Promise.all([
      createAnalysisTask(fileId),
      createSimulationTask(fileId, SIMULATABLE).catch(e => {
        console.warn('[Simulation] Task creation error (non-fatal):', e.message);
        return null;
      })
    ]);

    // 4: Poll both tasks in parallel
    const [analysisData, simulationData] = await Promise.all([
      pollTask('skin-analysis', analysisTaskId, 45000),
      simulationTaskId
        ? pollTask('skin-simulation', simulationTaskId, 45000).catch(e => {
            console.warn('[Simulation] Poll failed (non-fatal):', e.message);
            return null;
          })
        : Promise.resolve(null)
    ]);

    // Parse results
    const { scores, overallScore } = parseAnalysisResult(analysisData);
    const healedImage = simulationData ? parseSimulationResult(simulationData) : null;
    const topConcerns = getTopConcerns(scores, 3);

    console.log(`[analyse] ✅ Complete. overallScore=${overallScore}, concerns=${Object.keys(scores).length}, healed=${!!healedImage}`);

    return res.status(200).json({
      success: true,
      overallScore,
      scores,
      overlayImage: null,    // HD analysis returns per-concern mask_urls, not a single overlay
      healedImage,
      topConcerns,
      meta: {
        concernsAnalysed: Object.keys(scores).length,
        simulationTargets: topConcerns,
        simulationSuccess: !!healedImage,
        fileId
      }
    });

  } catch (error) {
    console.error('[analyse] Error:', error.message);
    return res.status(500).json({
      error: 'Analysis failed. Please try again with a clearer photo.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
