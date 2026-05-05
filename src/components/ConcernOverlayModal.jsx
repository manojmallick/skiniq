// src/components/ConcernOverlayModal.jsx
// Shows Perfect Corp mask_url overlay for a selected skin concern
// Activated by tapping any concern row in AnalysisScreen

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getScoreColor, getScoreClass } from '../services/api.js';

export default function ConcernOverlayModal({ concern, imageUrl, onClose }) {
  const [overlayLoaded, setOverlayLoaded] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!concern) return null;

  const hasMask = !!concern.maskUrl;
  const scoreClass = getScoreClass(concern.score);
  const scoreColor = getScoreColor(concern.score);
  const qualityLabel = concern.score >= 70 ? 'Healthy' : concern.score >= 45 ? 'Moderate' : 'Needs Attention';

  return createPortal(
    <div
      className="overlay-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`${concern.label} concern detail`}
    >
      <div className="overlay-modal">
        {/* Header */}
        <div className="overlay-modal-header">
          <div>
            <div className={`overlay-modal-badge ${scoreClass}`} style={{ borderColor: scoreColor }}>
              {concern.label}
            </div>
            <div className="overlay-modal-score" style={{ color: scoreColor }}>
              {concern.score}/100 — {qualityLabel}
            </div>
          </div>
          <button className="overlay-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Image comparison */}
        <div className="overlay-modal-body">
          {hasMask ? (
            <>
              <div className="overlay-modal-img-wrap">
                {/* Original photo */}
                <img
                  src={imageUrl}
                  alt="Your skin"
                  className="overlay-modal-base-img"
                  style={{ opacity: 1 - sliderPos / 100 }}
                />
                {/* Concern heatmap overlay */}
                <img
                  src={concern.maskUrl}
                  alt={`${concern.label} concern heatmap`}
                  className="overlay-modal-mask-img"
                  onLoad={() => setOverlayLoaded(true)}
                  style={{ opacity: sliderPos / 100 }}
                />
                {!overlayLoaded && (
                  <div className="overlay-modal-loading">
                    <div className="loading-dot" />
                    <div className="loading-dot" />
                    <div className="loading-dot" />
                  </div>
                )}
                <div className="overlay-modal-labels">
                  <span style={{ opacity: 1 - sliderPos / 100 }}>📸 Photo</span>
                  <span style={{ opacity: sliderPos / 100 }}>🔬 Concern Map</span>
                </div>
              </div>

              {/* Blend slider */}
              <div className="overlay-modal-slider-wrap">
                <label className="overlay-modal-slider-label">
                  <span>Photo</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPos}
                    onChange={(e) => setSliderPos(Number(e.target.value))}
                    className="overlay-modal-range"
                    aria-label="Blend photo with concern heatmap"
                  />
                  <span>Concern Map</span>
                </label>
              </div>

              <p className="overlay-modal-hint">
                🔴 Red areas = highest concern · Slide to blend AI heatmap with your photo
              </p>
            </>
          ) : (
            <div className="overlay-modal-no-mask">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
              <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>Score: {concern.score}/100</div>
              <p style={{ fontSize: '0.875rem' }}>
                {concern.isPositive
                  ? `${concern.label} is a positive indicator — higher scores mean better hydration and glow.`
                  : `${concern.label} scored ${concern.score}/100. ${concern.score >= 70 ? 'This area is healthy.' : 'This area may benefit from targeted treatment.'}`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
