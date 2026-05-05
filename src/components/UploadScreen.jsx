// src/components/UploadScreen.jsx
import { useRef, useState, useCallback } from 'react';

export default function UploadScreen({ onImageSelected, error }) {
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

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
