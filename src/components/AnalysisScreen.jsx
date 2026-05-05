// src/components/AnalysisScreen.jsx
import { useState } from 'react';
import SkinScoreBar from './SkinScoreBar.jsx';
import ConcernOverlayModal from './ConcernOverlayModal.jsx';
import { getOverallLabel, getScoreClass } from '../services/api.js';

export default function AnalysisScreen({ result, imageUrl, skinSummary, skinAge, onContinue }) {
  const { overallScore, scores, overlayImage, topConcerns } = result;
  const [selectedConcern, setSelectedConcern] = useState(null);

  const allScores = Object.values(scores).sort((a, b) => a.score - b.score);

  // Positive concerns (moisture, radiance, firmness): only flag if genuinely low (<55)
  // Negative concerns: flag if below 60
  const needsAttention = allScores.filter(s => s.isPositive ? s.score < 55 : s.score < 60);
  const healthy        = allScores.filter(s => s.isPositive ? s.score >= 55 : s.score >= 60);

  const overallLabel = getOverallLabel(overallScore);
  const overallClass = getScoreClass(overallScore);

  const overlayImgSrc = overlayImage
    ? (overlayImage.startsWith('http') ? overlayImage : `data:image/jpeg;base64,${overlayImage}`)
    : imageUrl;

  // Whether any concern has a mask URL (from the Perfect Corp API)
  const hasMaskData = allScores.some(s => s.maskUrl);

  return (
    <div className="screen-enter">
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <h2 style={{ fontSize: '1.15rem' }}>Your Skin Report</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {Object.keys(scores).length} concerns analysed
          </span>
        </div>
        <div className="card-body">

          {/* Overall Score */}
          <div className="analysis-hero">
            <div className="overall-score-circle" style={{ '--pct': overallScore }}>
              <span className="overall-score-number">{overallScore}</span>
              <span className="overall-score-label">/ 100</span>
            </div>
            <div className="overall-score-text">
              <h2>Overall Score: <span className={overallClass}>{overallScore}/100</span></h2>
              <p>{overallLabel}</p>
              {skinAge && (
                <div className="skin-age-badge">
                  ✨ Estimated skin age: <strong>{skinAge}</strong>
                </div>
              )}
            </div>
          </div>

          {/* AI Skin Summary */}
          {skinSummary && (
            <div className="skin-summary-card">
              <div className="skin-summary-icon">🤖</div>
              <p className="skin-summary-text">{skinSummary}</p>
            </div>
          )}

          {/* Photo */}
          <div className="overlay-image-wrap">
            <img src={overlayImgSrc} alt="Your skin photo" />
            <div className="overlay-label">
              {overlayImage ? '🔬 AI Analysis Overlay' : '📸 Your Photo'}
            </div>
          </div>

          {/* Tap hint if mask data is available */}
          {hasMaskData && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.75rem' }}>
              👆 Tap any concern to see the AI concern map
            </p>
          )}

          {/* Concerns needing attention */}
          {needsAttention.length > 0 && (
            <div className="concerns-grid" style={{ marginBottom: '1rem' }}>
              <div className="concern-section-title needs-attention">
                ⚠ Needs attention ({needsAttention.length})
              </div>
              {needsAttention.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedConcern(s)}
                  style={{ cursor: s.maskUrl ? 'pointer' : 'default' }}
                  title={s.maskUrl ? 'Tap to see AI concern map' : ''}
                >
                  <SkinScoreBar concern={s.label} score={s.score} delay={i * 80} />
                </div>
              ))}
            </div>
          )}

          {/* Healthy concerns */}
          {healthy.length > 0 && (
            <div className="concerns-grid">
              <div className="concern-section-title healthy">
                ✓ Healthy ({healthy.length})
              </div>
              {healthy.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedConcern(s)}
                  style={{ cursor: s.maskUrl ? 'pointer' : 'default' }}
                >
                  <SkinScoreBar
                    concern={s.label}
                    score={s.score}
                    delay={needsAttention.length * 80 + i * 60}
                    showBadge={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA to simulation */}
      <div className="cta-simulation">
        <h3>See Your Skin Healed →</h3>
        <p>
          We've simulated addressing your top {topConcerns.length} concerns.
          See the before/after and get personalised product recommendations.
        </p>
        <button id="see-simulation-btn" className="btn-white" onClick={onContinue}>
          ✨ See My Skin Potential
        </button>
      </div>

      {/* Concern Overlay Modal */}
      {selectedConcern && (
        <ConcernOverlayModal
          concern={selectedConcern}
          imageUrl={imageUrl}
          onClose={() => setSelectedConcern(null)}
        />
      )}
    </div>
  );
}
