import { useState, useEffect } from 'react';
import './App.css';
import APIStatus from './components/APIStatus';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorMessage from './components/ErrorMessage';
import FixturesList from './components/FixturesList';
import MatchInfo from './components/MatchInfo';
import PredictionDisplay from './components/PredictionDisplay';
import { ActualOddsDisplay } from './components/ActualOddsDisplay';
import AIChat from './components/AIChat';
import ComparisonResults from './components/ComparisonResults';
import { getFixtures, getTeamStatistics, getOdds, checkAPIStatus as checkFootballAPI } from './services/footballService';
import { generatePrediction, generateExplanation, compareOdds, checkAPIStatus as checkPredictionAPI } from './services/predictionService';
import { buildStatsPayload, formatDate } from './utils/helpers';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState({ hasFootballApiKey: false, hasQwenApiKey: false });
  const [fixtures, setFixtures] = useState([]);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [homeStats, setHomeStats] = useState(null);
  const [awayStats, setAwayStats] = useState(null);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [actualOdds, setActualOdds] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [selectedModel, setSelectedModel] = useState('qwen3-8b');
  const [lastMatchData, setLastMatchData] = useState(null);
  const [lastModelUsed, setLastModelUsed] = useState('qwen3-8b');

  useEffect(() => {
    checkAPIStatusAsync();
  }, []);

  const checkAPIStatusAsync = async () => {
    const footballStatus = await checkFootballAPI();
    const predictionStatus = await checkPredictionAPI();
    setApiStatus({
      hasFootballApiKey: footballStatus.hasFootballApiKey,
      hasQwenApiKey: predictionStatus.hasQwenApiKey
    });
  };

  const showError = (message) => {
    setError(message);
  };

  const handleLoadFixtures = async () => {
    setLoading(true);
    try {
      const result = await getFixtures();
      if (result.success) {
        setFixtures(result.data);
      } else {
        showError(result.error || 'Failed to load fixtures');
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFixture = async (fixture) => {
    setSelectedFixture(fixture);
    setAiPrediction(null);
    setActualOdds(null);
    setComparison(null);
    setLastMatchData(null);

    setLoading(true);
    try {
      const homeStatsResult = await getTeamStatistics(fixture.teams.home.id);
      const awayStatsResult = await getTeamStatistics(fixture.teams.away.id);

      setHomeStats(homeStatsResult.data);
      setAwayStats(awayStatsResult.data);

      // Scroll to prediction section
      setTimeout(() => {
        const section = document.querySelector('.prediction-section');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      showError('Error loading team statistics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePrediction = async () => {
    if (!selectedFixture) {
      showError('Please select a fixture first');
      return;
    }

    setLoading(true);
    try {
      const homeStatsResult = await getTeamStatistics(selectedFixture.teams.home.id);
      const awayStatsResult = await getTeamStatistics(selectedFixture.teams.away.id);

      const homeStatsPayload = buildStatsPayload(homeStatsResult.data);
      const awayStatsPayload = buildStatsPayload(awayStatsResult.data);

      const matchData = {
        homeTeam: selectedFixture.teams.home.name,
        awayTeam: selectedFixture.teams.away.name,
        date: formatDate(selectedFixture.fixture.date),
        homeStats: homeStatsPayload,
        awayStats: awayStatsPayload
      };

      setLastMatchData(matchData);

      const result = await generatePrediction(matchData, selectedModel);

      if (result.success) {
        setLastModelUsed(selectedModel);
        setAiPrediction(result.prediction);
        
        // If we have actual odds, compare automatically
        if (actualOdds) {
          handleCompare(result.prediction, actualOdds);
        }
      } else {
        showError(result.error || 'Failed to generate prediction');
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadOdds = async () => {
    if (!selectedFixture) {
      showError('Please select a fixture first');
      return;
    }

    setLoading(true);
    try {
      const result = await getOdds(selectedFixture.fixture.id);

      if (result.success && result.data && result.data.odds) {
        const oddsData = {
          homeWinDecimal: parseFloat(result.data.odds.homeWin),
          drawDecimal: parseFloat(result.data.odds.draw),
          awayWinDecimal: parseFloat(result.data.odds.awayWin),
          bookmakerName: result.data.bookmaker?.title || result.data.bookmaker?.key || 'Bookmaker'
        };
        setActualOdds(oddsData);
        
        // If we have AI prediction, compare automatically
        if (aiPrediction) {
          handleCompare(aiPrediction, oddsData);
        }
      } else {
        showError('No odds available. You can enter them manually.');
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualOdds = (oddsData) => {
    setActualOdds(oddsData);
    
    if (aiPrediction) {
      handleCompare(aiPrediction, oddsData);
    }
  };

  const handleCompare = (prediction, odds) => {
    const result = compareOdds(prediction, {
      homeWin: odds.homeWinDecimal,
      draw: odds.drawDecimal,
      awayWin: odds.awayWinDecimal
    });

    if (result.success) {
      setComparison(result);
      
      // Scroll to comparison section
      setTimeout(() => {
        const section = document.querySelector('.comparison-section');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      showError(result.error || 'Failed to compare odds');
    }
  };

  const handleAskQuestion = async (question) => {
    if (!aiPrediction || !lastMatchData) {
      showError('Generate a prediction first');
      return null;
    }

    setLoading(true);
    try {
      const result = await generateExplanation(
        lastMatchData,
        aiPrediction,
        question,
        lastModelUsed || selectedModel
      );

      if (result.success) {
        return result.explanation;
      } else {
        showError(result.error || 'Failed to get explanation');
        return null;
      }
    } catch (err) {
      showError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const modelOptions = [
    { value: 'qwen-turbo', label: 'Qwen Turbo', desc: 'Fast & cost-efficient' },
    { value: 'qwen3-max', label: 'Qwen3 Max', desc: 'Balanced accuracy vs. latency' },
    { value: 'qwen3-8b', label: 'Qwen3 8B', desc: 'Most accurate' }
  ];

  return (
    <div className="container">
      <header>
        <h1>⚽ Premier League Odds Prediction</h1>
        <p className="subtitle">AI-Powered Moneyline Odds Analysis using LLMs</p>
      </header>

      <APIStatus
        hasFootballApiKey={apiStatus.hasFootballApiKey}
        hasQwenApiKey={apiStatus.hasQwenApiKey}
      />

      <section className="controls">
        <button className="btn btn-primary" onClick={handleLoadFixtures}>
          Load Upcoming Fixtures
        </button>
        <div className="model-selector">
          <label htmlFor="modelSelect">LLM Model</label>
          <select
            id="modelSelect"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {modelOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <small>
            Current: {modelOptions.find(o => o.value === selectedModel)?.desc}
          </small>
        </div>
        <div className="info-box">
          <p><strong>How it works:</strong></p>
          <ol>
            <li>Load current Premier League fixtures (fallback to sample window if none found)</li>
            <li>Select a match to analyze</li>
            <li>AI analyzes team statistics and generates odds predictions</li>
            <li>Compare AI predictions with actual betting odds</li>
          </ol>
        </div>
      </section>

      {fixtures.length > 0 && (
        <FixturesList
          fixtures={fixtures}
          selectedFixtureId={selectedFixture?.fixture.id}
          onSelectFixture={handleSelectFixture}
        />
      )}

      {selectedFixture && homeStats && awayStats && (
        <section className="prediction-section">
          <h2>Match Analysis</h2>
          <MatchInfo
            fixture={selectedFixture}
            homeStats={homeStats}
            awayStats={awayStats}
          />

          <div className="prediction-container">
            <PredictionDisplay
              prediction={aiPrediction}
              onGenerate={handleGeneratePrediction}
              isLoading={loading}
            />

            <AIChat
              prediction={aiPrediction}
              onAskQuestion={handleAskQuestion}
              isLoading={loading}
            />

            <ActualOddsDisplay
              odds={actualOdds}
              onLoadOdds={handleLoadOdds}
              onManualSubmit={handleManualOdds}
              isLoading={loading}
            />
          </div>

          {comparison && <ComparisonResults comparison={comparison} />}
        </section>
      )}

      <footer>
        <p>Built with ❤️ using API-Football API and Qwen LLM</p>
        <p className="api-info">
          <strong>Sports API:</strong> API-Football -{' '}
          <a href="https://www.api-football.com/" target="_blank" rel="noopener noreferrer">
            Get API Key
          </a>{' '}
          | <strong>LLM API:</strong> Alibaba Cloud Qwen -{' '}
          <a href="https://dashscope.aliyun.com/" target="_blank" rel="noopener noreferrer">
            Get API Key
          </a>
        </p>
      </footer>

      {loading && <LoadingOverlay />}
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
    </div>
  );
}

export default App;
