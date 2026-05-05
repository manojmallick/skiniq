// src/components/LoadingState.jsx
export default function LoadingState({ step = 'analysis', imageUrl }) {
  const steps = {
    reading: {
      title: 'Reading your photo...',
      sub: 'Preparing image for clinical analysis'
    },
    analysis: {
      title: 'Analysing 14 skin concerns with clinical AI...',
      sub: 'Powered by Perfect Corp · validated by dermatologists · trained on 70,000 medical-grade images'
    },
    simulation: {
      title: 'Simulating your skin\'s potential...',
      sub: 'Perfect Corp AI is generating your personalised before/after result'
    },
    recommendations: {
      title: 'Personalising your product recommendations...',
      sub: 'Matching ingredients to your specific skin profile'
    }
  };

  const current = steps[step] || steps.analysis;

  return (
    <div className="loading-screen screen-enter">
      <div className="loading-scan">
        {imageUrl && (
          <img className="loading-scan-img" src={imageUrl} alt="Scanning" />
        )}
        {!imageUrl && (
          <div className="loading-scan-img" style={{
            background: 'linear-gradient(135deg, #E8F5EE 0%, #D1EAE0 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem'
          }}>🧬</div>
        )}
        <div className="loading-scan-ring" />
        <div className="loading-scan-ring-2" />
      </div>

      <div className="loading-step">{current.title}</div>
      <div className="loading-sub">{current.sub}</div>

      <div className="loading-dots">
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>

      <div className="loading-progress">
        <div className="loading-progress-bar" />
      </div>
    </div>
  );
}
