import React from 'react';

export default function APIStatus({ hasFootballApiKey, hasQwenApiKey }) {
  return (
    <div className="api-status">
      <h3>🔑 API Status</h3>
      <div className="status-grid">
        <div className="status-item">
          <span className="status-label">Football API:</span>
          <span className={`status-indicator ${hasFootballApiKey ? 'configured' : 'not-configured'}`}>
            {hasFootballApiKey ? '✓ Configured' : '✗ Not Configured'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Qwen API:</span>
          <span className={`status-indicator ${hasQwenApiKey ? 'configured' : 'not-configured'}`}>
            {hasQwenApiKey ? '✓ Configured' : '✗ Not Configured'}
          </span>
        </div>
      </div>
    </div>
  );
}
