// src/services/api.js — Frontend API service layer

const API_BASE = '/api';

// Perfect Corp HD Skin Analysis minimum image requirement
const MIN_SHORT_SIDE_PX = 1080;
const MAX_FILE_SIZE_BYTES = 9.5 * 1024 * 1024; // 9.5MB (API limit is 10MB)

/**
 * Ensure image meets Perfect Corp HD Skin Analysis requirements:
 *   - Short side ≥ 1080px
 *   - Portrait orientation preferred
 *   - Max 10MB
 * Upscales if needed using Canvas. Returns a new base64 data URL.
 */
function ensureMinimumSize(imageDataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const shortSide = Math.min(w, h);

      // Already meets requirements — return original
      if (shortSide >= MIN_SHORT_SIDE_PX) {
        console.log(`[resize] Image ${w}×${h} — OK (short side ${shortSide}px ≥ ${MIN_SHORT_SIDE_PX}px)`);
        resolve(imageDataUrl);
        return;
      }

      // Scale up so short side = MIN_SHORT_SIDE_PX
      const scale  = MIN_SHORT_SIDE_PX / shortSide;
      const newW   = Math.round(w * scale);
      const newH   = Math.round(h * scale);

      console.log(`[resize] Upscaling ${w}×${h} → ${newW}×${newH} (short side was ${shortSide}px)`);

      const canvas = document.createElement('canvas');
      canvas.width  = newW;
      canvas.height = newH;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled  = true;
      ctx.imageSmoothingQuality  = 'high';
      ctx.drawImage(img, 0, 0, newW, newH);

      // Export as JPEG at 92% quality (good balance for API accuracy)
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = imageDataUrl;
  });
}

/**
 * Analyse skin image — calls /api/analyse
 * @param {File} imageFile — the uploaded file
 * @returns {Promise<{overallScore, scores, overlayImage, healedImage, topConcerns, meta}>}
 */
export async function analyseSkin(imageFile) {
  // Step 1: Read file as base64 data URL
  let imageBase64 = await fileToBase64(imageFile);

  // Step 2: Ensure image meets Perfect Corp HD minimum (1080px short side)
  // Auto-upscales if too small using canvas
  imageBase64 = await ensureMinimumSize(imageBase64);

  // Step 3: Check resulting size (max 10MB after canvas encode)
  const base64Bytes = Math.round((imageBase64.length - imageBase64.indexOf(',') - 1) * 0.75);
  if (base64Bytes > MAX_FILE_SIZE_BYTES) {
    throw new Error('Image is too large even after processing (>10MB). Please use a smaller photo.');
  }

  const response = await fetch(`${API_BASE}/analyse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64 })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Analysis failed (${response.status})`);
  }

  return response.json();
}


/**
 * Get product recommendations — calls /api/recommend
 * @param {Object} scores — concern scores from analyseSkin()
 * @param {string[]} topConcerns — concern IDs to target
 * @param {string|null} skinType — e.g. "oily", "dry", "combination"
 * @returns {Promise<{recommendations, summary, skinAge, routine}>}
 */
export async function getRecommendations(scores, topConcerns, skinType = null) {
  const response = await fetch(`${API_BASE}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scores, topConcerns, skinType })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Recommendations failed (${response.status})`);
  }

  return response.json();
}

/**
 * Call the backend to trigger Makeup Virtual Try-On
 */
export async function tryVirtualMakeup(fileId) {
  const response = await fetch('/api/makeup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Makeup VTO failed (${response.status})`);
  }

  return response.json();
}

/**
 * Convert File to base64 string (with data URL prefix)
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get score color based on value (0-100)
 * Perfect Corp: higher = healthier for most concerns
 */
export function getScoreColor(score) {
  if (score >= 70) return 'var(--score-high)';
  if (score >= 45) return 'var(--score-mid)';
  return 'var(--score-low)';
}

export function getScoreLabel(score) {
  if (score >= 70) return 'Healthy';
  if (score >= 45) return 'Moderate';
  return 'Needs attention';
}

export function getScoreClass(score) {
  if (score >= 70) return 'score-high';
  if (score >= 45) return 'score-mid';
  return 'score-low';
}

export function getOverallLabel(score) {
  if (score >= 80) return 'Excellent skin health';
  if (score >= 65) return 'Good — room to improve';
  if (score >= 50) return 'Moderate — action recommended';
  return 'Needs targeted care';
}
