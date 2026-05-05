// src/utils/reportExporter.js
// Generates a beautiful branded skin report card as PNG using Canvas API
// No external dependencies — pure browser APIs only

const PRIMARY   = '#2D6A4F';
const PRIMARY_L = '#3A8562';
const ACCENT    = '#95D5B2';
const BG        = '#FAFAF8';
const TEXT      = '#1B1B1B';
const MUTED     = '#6B7280';
const RED       = '#E76F51';
const AMBER     = '#F4A261';
const GREEN     = '#52B788';

// ── Helpers ──────────────────────────────────────────────────────────────────
function scoreColor(score) {
  return score >= 70 ? GREEN : score >= 45 ? AMBER : RED;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line, x, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Main export function ──────────────────────────────────────────────────────
export async function generateReportImage({ overallScore, skinAge, skinSummary, recommendations, routine, scores }) {
  const W = 800;
  let H = 200; // will grow dynamically

  // ── First pass: calculate height ─────────────────────────────────────────
  let yCalc = 150; // Start Y position

  if (skinAge) yCalc += 52;
  if (skinSummary) yCalc += 90;

  const concernList = Object.values(scores || {}).sort((a, b) => a.score - b.score).slice(0, 6);
  yCalc += 24; // concerns header
  yCalc += concernList.length * 38;
  yCalc += 8;

  if (recommendations?.length) {
    yCalc += 24; // products header
    yCalc += recommendations.length * 90;
    yCalc += 8;
  }

  if (routine?.am?.length || routine?.pm?.length) {
    yCalc += 24; // routine header
    yCalc += 28; // column headers
    const amSteps = routine.am?.length || 0;
    const pmSteps = routine.pm?.length || 0;
    const maxSteps = Math.max(amSteps, pmSteps);
    yCalc += maxSteps * 32;
    yCalc += 16; // bottom padding
  }

  yCalc += 16; // footer top padding
  yCalc += 80; // footer content
  H = yCalc;

  // ── Create canvas ─────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#F0FAF4');
  grad.addColorStop(1, '#FAFAF8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle top band
  const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
  headerGrad.addColorStop(0, PRIMARY);
  headerGrad.addColorStop(1, PRIMARY_L);
  ctx.fillStyle = headerGrad;
  roundRect(ctx, 0, 0, W, 130, 0);
  ctx.fill();

  // SkinIQ logo text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 32px Inter, -apple-system, sans-serif';
  ctx.fillText('SkinIQ', 40, 55);

  ctx.font = '14px Inter, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('Your Skin Report · Powered by Perfect Corp AI', 40, 82);

  // Overall score circle (right side of header)
  const cx = W - 80, cy = 65, r = 45;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, (-Math.PI / 2) + (2 * Math.PI * overallScore / 100));
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(overallScore, cx, cy + 10);
  ctx.font = '11px Inter, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('/100', cx, cy + 28);
  ctx.textAlign = 'left';

  let y = 150;

  // Skin age badge
  if (skinAge) {
    ctx.fillStyle = 'rgba(45,106,79,0.1)';
    roundRect(ctx, 40, y, 220, 36, 18);
    ctx.fill();
    ctx.fillStyle = PRIMARY;
    ctx.font = '13px Inter, -apple-system, sans-serif';
    ctx.fillText(`✨  Estimated skin age: ${skinAge}`, 56, y + 23);
    y += 52;
  }

  // AI Summary
  if (skinSummary) {
    ctx.fillStyle = 'rgba(45,106,79,0.06)';
    roundRect(ctx, 32, y, W - 64, 72, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(45,106,79,0.2)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 32, y, W - 64, 72, 12);
    ctx.stroke();

    ctx.fillStyle = MUTED;
    ctx.font = '13px Inter, -apple-system, sans-serif';
    ctx.fillText('🤖  AI Summary', 52, y + 22);

    ctx.fillStyle = TEXT;
    ctx.font = 'italic 13px Inter, -apple-system, sans-serif';
    wrapText(ctx, `"${skinSummary}"`, 52, y + 44, W - 110, 18);
    y += 90;
  }

  // Separator
  const drawSection = (title) => {
    ctx.fillStyle = PRIMARY;
    ctx.font = 'bold 11px Inter, -apple-system, sans-serif';
    ctx.fillText(title.toUpperCase(), 40, y);
    ctx.fillStyle = 'rgba(45,106,79,0.15)';
    ctx.fillRect(40, y + 8, W - 80, 1.5);
    y += 24;
  };

  // ── Top Concerns ──────────────────────────────────────────────────────────
  drawSection('Skin Concerns');
  for (const s of concernList) {
    const barW = W - 240;
    const fillW = Math.round(barW * s.score / 100);

    ctx.fillStyle = TEXT;
    ctx.font = '13px Inter, -apple-system, sans-serif';
    ctx.fillText(s.label, 40, y + 14);

    // Track
    ctx.fillStyle = '#E5E7EB';
    roundRect(ctx, 220, y + 6, barW, 10, 5);
    ctx.fill();

    // Fill
    ctx.fillStyle = scoreColor(s.score);
    roundRect(ctx, 220, y + 6, fillW, 10, 5);
    ctx.fill();

    // Score
    ctx.fillStyle = scoreColor(s.score);
    ctx.font = 'bold 13px Inter, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${s.score}`, W - 40, y + 16);
    ctx.textAlign = 'left';

    y += 38;
  }
  y += 8;

  // ── Product Recommendations ───────────────────────────────────────────────
  if (recommendations?.length) {
    drawSection('Product Recommendations');

    for (const rec of recommendations) {
      // Card bg
      ctx.fillStyle = 'white';
      roundRect(ctx, 32, y, W - 64, 80, 10);
      ctx.shadowColor = 'rgba(0,0,0,0.06)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Concern badge
      const badgeColor = scoreColor(rec.score);
      ctx.fillStyle = badgeColor + '1A'; // 10% opacity
      roundRect(ctx, 48, y + 12, 120, 22, 11);
      ctx.fill();
      ctx.fillStyle = badgeColor;
      ctx.font = 'bold 10px Inter, -apple-system, sans-serif';
      ctx.fillText((rec.concern || '').toUpperCase().substring(0, 16), 56, y + 27);

      // Score on badge
      ctx.textAlign = 'right';
      ctx.fillText(`${rec.score}`, 164, y + 27);
      ctx.textAlign = 'left';

      // Product name
      ctx.fillStyle = TEXT;
      ctx.font = 'bold 15px Inter, -apple-system, sans-serif';
      ctx.fillText(rec.productType || '', 48, y + 50);

      // Ingredient
      ctx.fillStyle = PRIMARY;
      ctx.font = '12px Inter, -apple-system, sans-serif';
      ctx.fillText(`Key ingredient: ${rec.keyIngredient || ''}`, 48, y + 68);

      y += 90;
    }
    y += 8;
  }

  // ── AM/PM Routine ─────────────────────────────────────────────────────────
  if (routine?.am?.length || routine?.pm?.length) {
    drawSection('Daily Skincare Routine');

    const colW = (W - 100) / 2;
    const colStartY = y;

    // AM column
    ctx.fillStyle = PRIMARY;
    ctx.font = 'bold 13px Inter, -apple-system, sans-serif';
    ctx.fillText('☀ Morning', 40, y + 16);
    y += 28;

    for (let i = 0; i < (routine.am?.length || 0); i++) {
      // Step circle
      ctx.fillStyle = 'rgba(45,106,79,0.12)';
      ctx.beginPath();
      ctx.arc(54, y + 8, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = PRIMARY;
      ctx.font = 'bold 10px Inter, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(i + 1, 54, y + 12);
      ctx.textAlign = 'left';

      ctx.fillStyle = TEXT;
      ctx.font = '12px Inter, -apple-system, sans-serif';
      ctx.fillText(routine.am[i], 70, y + 12);
      y += 32;
    }

    // PM column
    let yPm = colStartY;
    ctx.fillStyle = PRIMARY;
    ctx.font = 'bold 13px Inter, -apple-system, sans-serif';
    ctx.fillText('🌙 Evening', 40 + colW + 20, yPm + 16);
    yPm += 28;

    for (let i = 0; i < (routine.pm?.length || 0); i++) {
      ctx.fillStyle = 'rgba(45,106,79,0.12)';
      ctx.beginPath();
      ctx.arc(40 + colW + 34, yPm + 8, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = PRIMARY;
      ctx.font = 'bold 10px Inter, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(i + 1, 40 + colW + 34, yPm + 12);
      ctx.textAlign = 'left';

      ctx.fillStyle = TEXT;
      ctx.font = '12px Inter, -apple-system, sans-serif';
      ctx.fillText(routine.pm[i], 40 + colW + 50, yPm + 12);
      yPm += 32;
    }

    y = Math.max(y, yPm) + 16;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  y += 16;
  ctx.fillStyle = 'rgba(45,106,79,0.08)';
  ctx.fillRect(0, y, W, H - y);

  ctx.fillStyle = PRIMARY;
  ctx.font = 'bold 14px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SkinIQ', W / 2, y + 30);

  ctx.fillStyle = MUTED;
  ctx.font = '11px Inter, -apple-system, sans-serif';
  ctx.fillText('Powered by Perfect Corp AI · skiniq.app', W / 2, y + 50);
  ctx.textAlign = 'left';

  return canvas;
}

// ── Download as PNG ───────────────────────────────────────────────────────────
export async function downloadReportImage(reportData) {
  const canvas = await generateReportImage(reportData);
  const link = document.createElement('a');
  link.download = `SkinIQ-Report-${new Date().toISOString().split('T')[0]}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ── Print as PDF ──────────────────────────────────────────────────────────────
// Uses browser print dialog — zero dependency, looks great on mobile too
export function printReportAsPDF() {
  window.print();
}
