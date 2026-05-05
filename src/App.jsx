// src/App.jsx — Main state machine: upload → loading → analysis → simulation
import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from './i18n/LanguageContext.jsx';
import { analyseSkin, getRecommendations } from './services/api.js';
import UploadScreen from './components/UploadScreen.jsx';
import AnalysisScreen from './components/AnalysisScreen.jsx';
import SimulationScreen from './components/SimulationScreen.jsx';
import LoadingState from './components/LoadingState.jsx';

// Screens: 'upload' | 'loading' | 'analysis' | 'simulation'
const SCREENS = { UPLOAD: 'upload', LOADING: 'loading', ANALYSIS: 'analysis', SIMULATION: 'simulation' };

function LanguageSwitcher() {
  const { locale, setLocale, languages } = useLanguage();
  return (
    <select 
      value={locale} 
      onChange={(e) => setLocale(e.target.value)}
      style={{ marginLeft: '0.75rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text)', outline: 'none' }}
    >
      {Object.keys(languages).map(key => (
        <option key={key} value={key}>🌍 {languages[key].name}</option>
      ))}
    </select>
  );
}

export default function App() {
  const { locale } = useLanguage();
  const [screen, setScreen]               = useState(SCREENS.UPLOAD);
  const [loadingStep, setLoadingStep]     = useState('analysis');
  const [imageUrl, setImageUrl]           = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [skinSummary, setSkinSummary]     = useState(null);
  const [skinAge, setSkinAge]             = useState(null);
  const [routine, setRoutine]             = useState(null);
  const [error, setError]                 = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (analysisResult && (screen === SCREENS.ANALYSIS || screen === SCREENS.SIMULATION)) {
      const skinTypeScore = analysisResult.scores?.hd_skin_type;
      const skinType = skinTypeScore?.label || null;

      const fetchTranslation = async () => {
        setIsTranslating(true);
        try {
          const recResult = await getRecommendations(analysisResult.scores, analysisResult.topConcerns, skinType, locale);
          setRecommendations(recResult.recommendations || []);
          setSkinSummary(recResult.summary || null);
          setRoutine(recResult.routine || null);
        } catch (e) {
          console.warn('Translation failed:', e);
        } finally {
          setIsTranslating(false);
        }
      };
      fetchTranslation();
    }
  }, [locale]); // Trigger only when locale changes

  const handleImageSelected = useCallback(async (file, previewUrl) => {
    setImageUrl(previewUrl);
    setError(null);
    setScreen(SCREENS.LOADING);
    setLoadingStep('analysis');

    try {
      const result = await analyseSkin(file);
      setAnalysisResult(result);
      setScreen(SCREENS.ANALYSIS);

      // Save history
      try {
        const history = JSON.parse(localStorage.getItem('skiniq_history') || '[]');
        history.push({ 
          date: new Date().toISOString(), 
          overallScore: result.overallScore,
          scores: result.scores 
        });
        if (history.length > 20) history.shift();
        localStorage.setItem('skiniq_history', JSON.stringify(history));
      } catch (e) {
        console.warn('Could not save history to localStorage', e);
      }

      // Extract skin type label from scores
      const skinTypeScore = result.scores?.hd_skin_type;
      const skinType = skinTypeScore?.label || null;

      try {
        setLoadingStep('recommendations');
        const recResult = await getRecommendations(result.scores, result.topConcerns, skinType, locale);
        setRecommendations(recResult.recommendations || []);
        setSkinSummary(recResult.summary || null);
        setSkinAge(recResult.skinAge || null);
        setRoutine(recResult.routine || null);
      } catch (recErr) {
        console.warn('Recommendations failed (non-fatal):', recErr.message);
        setRecommendations([]);
      }

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Analysis failed. Please try with a clearer photo in good lighting.');
      setScreen(SCREENS.UPLOAD);
    }
  }, [locale]);

  const handleContinueToSimulation = useCallback(() => {
    setScreen(SCREENS.SIMULATION);
  }, []);

  const handleRetake = useCallback(() => {
    setAnalysisResult(null);
    setRecommendations(null);
    setSkinSummary(null);
    setSkinAge(null);
    setRoutine(null);
    setImageUrl(null);
    setError(null);
    setScreen(SCREENS.UPLOAD);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <a className="header-logo" href="/" onClick={(e) => { e.preventDefault(); handleRetake(); }}>
          <div className="header-logo-mark">🧴</div>
          <span className="header-logo-text">SkinIQ</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="header-badge">Perfect Corp AI</span>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="main">
        <div className="container">
          {screen === SCREENS.UPLOAD && (
            <UploadScreen onImageSelected={handleImageSelected} error={error} />
          )}
          {screen === SCREENS.LOADING && (
            <LoadingState step={loadingStep} imageUrl={imageUrl} />
          )}
          {screen === SCREENS.ANALYSIS && analysisResult && (
            <AnalysisScreen
              result={analysisResult}
              imageUrl={imageUrl}
              skinSummary={skinSummary}
              skinAge={skinAge}
              onContinue={handleContinueToSimulation}
            />
          )}
          {screen === SCREENS.SIMULATION && analysisResult && (
            <SimulationScreen
              result={analysisResult}
              imageUrl={imageUrl}
              recommendations={recommendations}
              routine={routine}
              skinSummary={skinSummary}
              skinAge={skinAge}
              onRetake={handleRetake}
              isTranslating={isTranslating}
            />
          )}
        </div>
      </main>
    </div>
  );
}
