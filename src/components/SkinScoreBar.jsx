// src/components/SkinScoreBar.jsx
import { useEffect, useRef } from 'react';
import { getScoreColor, getScoreClass, getScoreLabel } from '../services/api.js';

export default function SkinScoreBar({ concern, score, delay = 0, showBadge = true }) {
  const fillRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (fillRef.current) {
        fillRef.current.style.width = `${score}%`;
      }
    }, delay + 100);
    return () => clearTimeout(timer);
  }, [score, delay]);

  const color = getScoreColor(score);
  const cls   = getScoreClass(score);
  const label = getScoreLabel(score);

  return (
    <div className="score-bar-wrap">
      <div className="score-bar-header">
        <span className="score-bar-label">{concern}</span>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {showBadge && (
            <span className={`score-bar-badge ${cls}-bg ${cls}`}>
              {label}
            </span>
          )}
          <span className={`score-bar-value ${cls}`} style={{ marginLeft: '0.5rem' }}>
            {score}
          </span>
        </div>
      </div>
      <div className="score-bar-track">
        <div
          ref={fillRef}
          className="score-bar-fill"
          style={{ width: '0%', background: color }}
        />
      </div>
    </div>
  );
}
