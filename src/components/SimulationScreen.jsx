// src/components/SimulationScreen.jsx — THE CENTREPIECE
// Before/After slider + Product recommendations
import { useRef, useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getScoreColor, getScoreClass, tryVirtualMakeup } from '../services/api.js';
import { downloadReportImage, printReportAsPDF } from '../utils/reportExporter.js';

// ── Before/After Slider ──────────────────────────────────────────────────────
function BeforeAfterSlider({ beforeSrc, afterSrc }) {
  const [position, setPosition] = useState(50); // % from right clipped
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const getPercent = useCallback((clientX) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return Math.round((x / rect.width) * 100);
  }, []);

  const startDrag = (e) => {
    isDragging.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setPosition(getPercent(clientX));
  };

  const onDrag = useCallback((e) => {
    if (!isDragging.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setPosition(getPercent(clientX));
  }, [getPercent]);

  const stopDrag = () => { isDragging.current = false; };

  useEffect(() => {
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onDrag, { passive: true });
    window.addEventListener('touchend', stopDrag);
    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', onDrag);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [onDrag]);

  // clip = how much of the "after" image is hidden from the right
  const clip = 100 - position;

  return (
    <div
      id="before-after-slider"
      ref={containerRef}
      className="slider-container"
      style={{ aspectRatio: '4/3', minHeight: '220px' }}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      {/* Before (original) */}
      <div className="slider-before">
        <img src={beforeSrc} alt="Before — original skin" draggable={false} />
      </div>

      {/* After (healed) */}
      <div
        className="slider-after"
        style={{ '--clip': `${clip}%` }}
      >
        <img src={afterSrc} alt="After — simulated healed skin" draggable={false} />
      </div>

      {/* Handle */}
      <div
        className="slider-handle"
        style={{ left: `${position}%` }}
      >
        <div className="slider-handle-line" />
        <div className="slider-handle-btn">⇔</div>
        <div className="slider-handle-line" />
      </div>

      {/* Labels */}
      <div className="slider-label-before">{t('sim_slider_before') || 'Before'}</div>
      <div className="slider-label-after">{t('sim_slider_after') || 'After'}</div>
    </div>
  );
}

// ── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ rec, index }) {
  const color = getScoreColor(rec.score);
  const cls   = getScoreClass(rec.score);

  const severityEmoji = rec.severity === 'high' ? '🔴' : rec.severity === 'medium' ? '🟡' : '🟢';

  return (
    <div className="product-card" style={{ animationDelay: `${index * 0.1}s` }}>
      {rec.actualProduct && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', background: '#f8fdfa', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(45,106,79,0.1)' }}>
          <img src={rec.actualProduct.image} alt={rec.actualProduct.name} style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '4px', background: 'white', padding: '4px', border: '1px solid #eee' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.actualProduct.brand}</div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: '1.2', marginTop: '0.1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{rec.actualProduct.name}</div>
          </div>
          <a href={rec.actualProduct.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '100px', whiteSpace: 'nowrap', textDecoration: 'none' }}>
            {t('sim_buy') || 'Buy'}
          </a>
        </div>
      )}
      <div className="product-card-header">
        <div
          className={`product-concern-badge ${cls}-bg ${cls}`}
          style={{ borderColor: color }}
        >
          {severityEmoji} {rec.concern}
          <span style={{ fontWeight: 400, marginLeft: '0.25rem' }}>· {rec.score}/100</span>
        </div>
      </div>
      <div className="product-info">
        <div className="product-type">{rec.productType}</div>
        <div className="product-ingredient">Key ingredient: {rec.keyIngredient}</div>
      </div>
      <p className="product-explanation">{rec.explanation}</p>
      {rec.usageHint && (
        <div className="product-usage-hint">
          <span className="product-usage-hint-icon">💡</span>
          <span>{rec.usageHint}</span>
        </div>
      )}
    </div>
  );
}

// ── AM/PM Routine Card ────────────────────────────────────────────────────────
function RoutineCard({ routine }) {
  if (!routine) return null;
  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="card-header">
        <div>
          <h3 style={{ marginBottom: '0.1rem' }}>{t('sim_routine')}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            {t('sim_routine_sub')}
          </p>
        </div>
        <div style={{
          fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'var(--primary)',
          background: 'rgba(45,106,79,0.08)',
          padding: '0.3rem 0.7rem', borderRadius: '100px'
        }}>
          Gemini AI
        </div>
      </div>
      <div className="card-body">
        <div className="routine-columns">
          <div className="routine-col">
            <div className="routine-col-title">{t('sim_am')}</div>
            {(routine.am || []).map((step, i) => (
              <div key={i} className="routine-step">
                <span className="routine-step-num">{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
          <div className="routine-col">
            <div className="routine-col-title">{t('sim_pm')}</div>
            {(routine.pm || []).map((step, i) => (
              <div key={i} className="routine-step">
                <span className="routine-step-num">{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main SimulationScreen ─────────────────────────────────────────────────────
export default function SimulationScreen({ result, imageUrl, recommendations, routine, skinSummary, skinAge, onRetake }) {
  const { t } = useLanguage();
  const { healedImage, topConcerns, scores, meta } = result;

  const [makeupImage, setMakeupImage] = useState(null);
  const [isApplyingMakeup, setIsApplyingMakeup] = useState(false);
  const [makeupError, setMakeupError] = useState(null);

  const beforeSrc = imageUrl;
  const afterSrc = makeupImage 
    ? (makeupImage.startsWith('http') ? makeupImage : `data:image/jpeg;base64,${makeupImage}`)
    : (healedImage
      ? (healedImage.startsWith('http') ? healedImage : `data:image/jpeg;base64,${healedImage}`)
      : imageUrl);

  const simulationAvailable = !!healedImage;

  const handleMakeup = async () => {
    if (!meta?.fileId) return;
    setIsApplyingMakeup(true);
    setMakeupError(null);
    try {
      const resp = await tryVirtualMakeup(meta.fileId);
      if (resp.makeupImage) {
        setMakeupImage(resp.makeupImage);
      } else {
        setMakeupError('No image returned');
      }
    } catch (e) {
      setMakeupError(e.message);
    } finally {
      setIsApplyingMakeup(false);
    }
  };
  const handleShare = async () => {
    const shareData = {
      title: 'My SkinIQ Report',
      text: `I just got my skin analysed by SkinIQ — powered by Perfect Corp AI! Check yours out.`,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (e) {
      console.log('Share cancelled');
    }
  };

  return (
    <div className="screen-enter">
      <div className="simulation-header">
        <h2>{t('sim_header_title')}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {t('sim_header_sub')}
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body" style={{ padding: '1rem' }}>
          {simulationAvailable ? (
            <>
              <BeforeAfterSlider beforeSrc={beforeSrc} afterSrc={afterSrc} />
              <div className="slider-hint">
                <span className="slider-hint-arrow">←</span>
                {t('sim_slider_hint')} {makeupImage && '💄'}
                <span className="slider-hint-arrow" style={{ animationDirection: 'reverse' }}>→</span>
              </div>
              
              {!makeupImage && (
                <div style={{ textAlign: 'center', margin: '0.5rem 0 1.5rem' }} className="cta-simulation">
                  <button 
                    className="btn btn-primary" 
                    onClick={handleMakeup} 
                    disabled={isApplyingMakeup || !meta?.fileId}
                    style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', borderRadius: '100px', background: 'var(--accent)', border: 'none', color: 'var(--primary)' }}
                  >
                    {isApplyingMakeup ? t('sim_btn_makeup_loading') : t('sim_btn_makeup')}
                  </button>
                  {makeupError && <div style={{ color: '#E76F51', fontSize: '0.75rem', marginTop: '0.4rem' }}>{makeupError}</div>}
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                {topConcerns.map(id => (
                  <span key={id} style={{
                    fontSize: '0.75rem', fontWeight: 600,
                    padding: '0.25rem 0.65rem', borderRadius: '100px',
                    background: 'rgba(45,106,79,0.1)', color: 'var(--primary)'
                  }}>
                    ✓ {scores[id]?.label || id}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
              <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>Simulation results below</div>
              <p style={{ fontSize: '0.875rem' }}>
                Your analysis is complete. See your personalised recommendations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Product Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header">
            <div>
              <h3 style={{ marginBottom: '0.1rem' }}>{t('sim_shop')}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {t('sim_shop_sub')}
              </p>
            </div>
            <div style={{
              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--primary)',
              background: 'rgba(45,106,79,0.08)',
              padding: '0.3rem 0.7rem', borderRadius: '100px'
            }}>
              AI Powered
            </div>
          </div>
          <div className="card-body">
            {recommendations.map((rec, i) => (
              <ProductCard key={rec.concernId || i} rec={rec} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* AM/PM Routine */}
      <RoutineCard routine={routine} />

      {/* Footer actions */}
      <div className="action-footer">
        <button id="retake-btn" className="btn btn-secondary" onClick={onRetake} style={{ flex: 1 }}>
          ↩ {t('sim_btn_retake')}
        </button>
        <button id="share-btn" className="btn btn-primary" onClick={handleShare} style={{ flex: 1 }}>
          📤 {t('sim_btn_share') || 'Share Results'}
        </button>
      </div>

      <div className="action-footer" style={{ marginTop: '0.75rem', paddingTop: 0, borderTop: 'none' }}>
        <button className="btn btn-secondary" onClick={() => downloadReportImage({
            overallScore: result.overallScore,
            skinAge,
            skinSummary,
            recommendations,
            routine,
            scores: result.scores
          })} style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
          🖼️ Save Image
        </button>
        <button className="btn btn-secondary" onClick={printReportAsPDF} style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
          📄 Save PDF
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <a
          href="https://yce.perfectcorp.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}
        >
          🔗 Powered by Perfect Corp AI · Built for Startup World Cup Hackathon
        </a>
      </div>

      <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>
        <a href="https://github.com/manojmallick/skiniq" target="_blank" rel="noopener noreferrer"
           style={{ color: 'var(--primary)' }}>
          ⭐ Open Source on GitHub
        </a>
      </div>
    </div>
  );
}
