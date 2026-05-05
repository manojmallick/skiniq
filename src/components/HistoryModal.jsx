import React from 'react';
import { getScoreClass, getScoreColor } from '../services/api';

export default function HistoryModal({ history, onClose }) {
  if (!history || history.length === 0) return null;

  // Show newest sessions first
  const reversedHistory = [...history].reverse();

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto', padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Analysis History</h2>
          <button onClick={onClose} style={{ padding: '0.2rem 0.6rem', fontSize: '1.5rem', border: 'none', background: 'transparent', cursor: 'pointer', lineHeight: 1, color: 'var(--text-muted)' }}>×</button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reversedHistory.map((session, index) => {
            const dateObj = new Date(session.date);
            const dateStr = isNaN(dateObj.getTime()) ? 'Unknown Date' : dateObj.toLocaleDateString(undefined, { 
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const cls = getScoreClass(session.overallScore);
            const color = getScoreColor(session.overallScore);
            
            // Calculate top 3 concerns for this session dynamically
            const top3 = Object.values(session.scores || {})
              .filter(s => !s.isPositive) // only negative concerns
              .sort((a, b) => a.score - b.score)
              .slice(0, 3);

            return (
              <div key={index} className="card" style={{ padding: '1rem', borderLeft: `4px solid ${color}`, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{dateStr}</div>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem' }} className={cls}>{session.overallScore}<span style={{fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500}}>/100</span></div>
                </div>
                
                {top3.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.05em', fontWeight: 600 }}>Top Concerns Detected</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {top3.map(c => (
                        <span key={c.id} style={{
                          fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px',
                          background: 'rgba(231,111,81,0.1)', color: '#E76F51', fontWeight: 500
                        }}>
                          {c.label || c.id} ({c.score})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
