// src/components/UploadScreen.jsx
import { useRef, useState, useCallback, useEffect } from 'react';

// ── Progress Sparkline ───────────────────────────────────────────────────────
function ProgressSparkline({ data }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const padding = 10;
  const width = 150;
  const height = 40;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = max === min ? height / 2 : height - ((d - min) / (max - min)) * (height - padding * 2) - padding;
    return `${x},${y}`;
  });

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', margin: '0.5rem 0' }}>
      <polyline
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(' ')}
      />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
        const y = max === min ? height / 2 : height - ((d - min) / (max - min)) * (height - padding * 2) - padding;
        return (
          <circle key={i} cx={x} cy={y} r="3" fill={i === data.length - 1 ? 'var(--accent)' : 'var(--primary)'} />
        );
      })}
    </svg>
  );
}

export default function UploadScreen({ onImageSelected, error }) {
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [history, setHistory] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('skiniq_history') || '[]');
      if (Array.isArray(stored)) {
        setHistory(stored.slice(-5)); // keep last 5 for UI
      }
    } catch (e) {
      console.warn('Could not read history', e);
    }
  }, []);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, HEIC).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert('Please use a photo under 15MB.');
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleInputChange = (e) => handleFile(e.target.files[0]);

  const handleAnalyse = () => {
    if (selectedFile) onImageSelected(selectedFile, preview);
  };

  return (
    <div className="screen-enter">
      <div className="upload-hero">
        <div className="upload-tagline">⚡ Perfect Corp Clinical AI</div>
        <h1 className="upload-title">
          Your skin.<br />Analysed. Healed. Shopped.
        </h1>
        <p className="upload-sub">
          Upload a selfie — get a clinical-grade analysis of 14 skin concerns in 30 seconds.
          See your skin healed. Find the products to get there.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body">
          {!preview ? (
            <div
              id="upload-zone"
              className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/heic,image/webp"
                onChange={handleInputChange}
                style={{ display: 'none' }}
                id="file-input"
              />
              <span className="upload-icon">📸</span>
              <div className="upload-zone-title">Upload your selfie</div>
              <div className="upload-zone-sub">
                Tap to choose a photo · or drag &amp; drop<br />
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>
                  Use a clear, high-res photo (HD camera recommended)
                </span>
              </div>
            </div>
          ) : (
            <div className="upload-preview">
              <img src={preview} alt="Your selfie for analysis" />
              <div className="upload-preview-overlay">
                <button
                  className="upload-change-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview(null);
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  ↩ Change photo
                </button>
              </div>
            </div>
          )}

          <div className="upload-tips">
            <div className="upload-tip">
              <div className="upload-tip-icon">☀️</div>
              <div className="upload-tip-text">Good lighting</div>
            </div>
            <div className="upload-tip">
              <div className="upload-tip-icon">😐</div>
              <div className="upload-tip-text">Face forward, neutral</div>
            </div>
            <div className="upload-tip">
              <div className="upload-tip-icon">🚫</div>
              <div className="upload-tip-text">No filters or makeup</div>
            </div>
          </div>

          {error && (
            <div className="error-card">
              <span className="error-icon">⚠️</span>
              <div className="error-text">
                <h4>Analysis failed</h4>
                <p>{error}</p>
              </div>
            </div>
          )}

          <button
            id="analyse-btn"
            className="btn btn-primary btn-full"
            onClick={handleAnalyse}
            disabled={!selectedFile}
            style={{ marginTop: '0.5rem' }}
          >
            {selectedFile ? '✨ Analyse My Skin' : 'Select a photo first'}
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(45,106,79,0.03)', border: '1px solid rgba(45,106,79,0.1)' }}>
          <div className="card-body" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Your Progress</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {history.length} analysis sessions
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>
                  {history[history.length - 1].overallScore}
                </div>
                {history.length > 1 && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: history[history.length - 1].overallScore > history[history.length - 2].overallScore ? 'var(--score-high)' : history[history.length - 1].overallScore < history[history.length - 2].overallScore ? 'var(--score-low)' : 'var(--text-muted)' }}>
                    {history[history.length - 1].overallScore > history[history.length - 2].overallScore ? '↑ Improving' : history[history.length - 1].overallScore < history[history.length - 2].overallScore ? '↓ Declining' : '→ Stable'}
                  </div>
                )}
              </div>
            </div>
            {history.length > 1 && (
              <ProgressSparkline data={history.map(h => h.overallScore)} />
            )}
          </div>
        </div>
      )}

      <div className="trust-badges">
        <div className="trust-badge">
          <div className="trust-badge-dot" />
          GDPR Compliant
        </div>
        <div className="trust-badge">
          <div className="trust-badge-dot" />
          HIPAA Ready
        </div>
        <div className="trust-badge">
          <div className="trust-badge-dot" />
          No data stored
        </div>
      </div>

      <div className="powered-by">
        Powered by <span>Perfect Corp YouCam AI</span> · Clinical-grade · Dermatologist validated
      </div>
    </div>
  );
}
