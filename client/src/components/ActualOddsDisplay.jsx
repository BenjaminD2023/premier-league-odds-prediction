import React, { useState } from 'react';
import { formatMoneylineWithProbability, convertDecimalToAmerican } from '../utils/helpers';

export default function ActualOddsDisplay({ odds, onLoadOdds, onManualSubmit, isLoading }) {
  const [manualMode, setManualMode] = useState(false);
  const [manualOdds, setManualOdds] = useState({ homeWin: '', draw: '', awayWin: '' });

  const handleManualSubmit = () => {
    const homeWin = parseFloat(manualOdds.homeWin);
    const draw = parseFloat(manualOdds.draw);
    const awayWin = parseFloat(manualOdds.awayWin);

    if (isNaN(homeWin) || isNaN(draw) || isNaN(awayWin)) {
      alert('Please enter valid decimal odds for all outcomes');
      return;
    }

    onManualSubmit({
      homeWinDecimal: homeWin,
      drawDecimal: draw,
      awayWinDecimal: awayWin,
      homeWinAmerican: convertDecimalToAmerican(homeWin),
      drawAmerican: convertDecimalToAmerican(draw),
      awayWinAmerican: convertDecimalToAmerican(awayWin),
      bookmakerName: 'Manual Entry'
    });
    setManualMode(false);
  };

  if (!odds && !manualMode) {
    return (
      <div className="prediction-box">
        <h3>📊 Actual Moneyline Odds</h3>
        <div className="prediction-content">
          <p className="placeholder">Load moneyline odds from bookmakers</p>
          <button 
            className="btn btn-secondary" 
            onClick={onLoadOdds}
            disabled={isLoading}
          >
            Load Actual Moneyline Odds
          </button>
        </div>
      </div>
    );
  }

  if (manualMode) {
    return (
      <div className="prediction-box">
        <h3>📊 Actual Moneyline Odds</h3>
        <div className="prediction-content">
          <p style={{ marginBottom: '15px', textAlign: 'center' }}>
            No moneyline odds available from API. Enter bookmaker odds manually:
          </p>
          <div className="odds-display">
            <div className="odds-item">
              <span className="odds-label">Home Moneyline:</span>
              <input
                type="number"
                step="0.01"
                placeholder="2.50"
                value={manualOdds.homeWin}
                onChange={(e) => setManualOdds({ ...manualOdds, homeWin: e.target.value })}
                style={{ width: '80px', padding: '5px', fontSize: '1.2em' }}
              />
            </div>
            <div className="odds-item">
              <span className="odds-label">Draw:</span>
              <input
                type="number"
                step="0.01"
                placeholder="3.20"
                value={manualOdds.draw}
                onChange={(e) => setManualOdds({ ...manualOdds, draw: e.target.value })}
                style={{ width: '80px', padding: '5px', fontSize: '1.2em' }}
              />
            </div>
            <div className="odds-item">
              <span className="odds-label">Away Moneyline:</span>
              <input
                type="number"
                step="0.01"
                placeholder="2.80"
                value={manualOdds.awayWin}
                onChange={(e) => setManualOdds({ ...manualOdds, awayWin: e.target.value })}
                style={{ width: '80px', padding: '5px', fontSize: '1.2em' }}
              />
            </div>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={handleManualSubmit}
            style={{ width: '100%', marginTop: '15px' }}
          >
            Submit Odds
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="prediction-box">
      <h3>📊 Actual Moneyline Odds</h3>
      <div className="prediction-content">
        <div className="odds-display">
          <div className="odds-item">
            <span className="odds-label">Home Moneyline:</span>
            <span 
              className="odds-value"
              dangerouslySetInnerHTML={{ 
                __html: formatMoneylineWithProbability(odds.homeWinDecimal) 
              }}
            />
          </div>
          <div className="odds-item">
            <span className="odds-label">Draw:</span>
            <span 
              className="odds-value"
              dangerouslySetInnerHTML={{ 
                __html: formatMoneylineWithProbability(odds.drawDecimal) 
              }}
            />
          </div>
          <div className="odds-item">
            <span className="odds-label">Away Moneyline:</span>
            <span 
              className="odds-value"
              dangerouslySetInnerHTML={{ 
                __html: formatMoneylineWithProbability(odds.awayWinDecimal) 
              }}
            />
          </div>
        </div>
        <p style={{ textAlign: 'center', marginTop: '15px', color: '#666', fontSize: '0.9em' }}>
          Moneyline odds from {odds.bookmakerName || 'bookmaker'}
        </p>
      </div>
    </div>
  );
}

// Export function to trigger manual mode
export { ActualOddsDisplay };
