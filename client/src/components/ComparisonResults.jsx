import React from 'react';

export default function ComparisonResults({ comparison }) {
  if (!comparison) return null;

  return (
    <div className="comparison-section">
      <h3>📈 Accuracy Comparison</h3>
      <div className="comparison-results">
        <div className="accuracy-score">{comparison.accuracy}%</div>
        <p style={{ textAlign: 'center', fontSize: '1.2em', marginBottom: '20px' }}>
          Overall Accuracy
        </p>

        <div className="comparison-grid">
          {['homeWin', 'draw', 'awayWin'].map((key) => {
            const data = comparison.comparison[key];
            const label = key === 'homeWin' ? 'Home Win' : key === 'draw' ? 'Draw' : 'Away Win';
            
            return (
              <div key={key} className="comparison-item">
                <div className="comparison-header">{label}</div>
                <div className="comparison-values">
                  <div className="value-box">
                    <span className="value-label">AI Prediction</span>
                    <div className="value-number">{data.llm.toFixed(2)}</div>
                  </div>
                  <div className="value-box">
                    <span className="value-label">Actual Odds</span>
                    <div className="value-number">{data.actual.toFixed(2)}</div>
                  </div>
                  <div className="value-box">
                    <span className="value-label">Difference</span>
                    <div className="value-number">{data.difference.toFixed(2)}</div>
                  </div>
                </div>
                <div className="difference">
                  {data.percentageDiff.toFixed(2)}% difference
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '8px' }}>
          <strong>Summary:</strong> The AI's closest prediction was for{' '}
          <strong>{comparison.summary.closestPrediction}</strong> with an average difference of{' '}
          <strong>{comparison.summary.averageDifference}%</strong> across all outcomes.
        </div>
      </div>
    </div>
  );
}
