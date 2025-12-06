import React from 'react';
import { formatDate, isSampleFixture } from '../utils/helpers';

function formatTeamStats(stats) {
  if (!stats) {
    return <p>Statistics not available</p>;
  }

  const renderBlock = (label, payload) => {
    if (!payload) return null;
    
    const played = payload.fixtures?.played?.total ?? 'N/A';
    const wins = payload.fixtures?.wins?.total ?? 'N/A';
    const draws = payload.fixtures?.draws?.total ?? 'N/A';
    const loses = payload.fixtures?.loses?.total ?? 'N/A';
    const goalsFor = payload.goals?.for?.total?.total ?? 'N/A';
    const goalsAgainst = payload.goals?.against?.total?.total ?? 'N/A';
    const form = payload.form || 'N/A';
    const rank = payload.league?.rank ? `Rank: #${payload.league.rank}` : '';
    const subLabel = payload.label ? ` • ${payload.label}` : '';

    return (
      <div key={label} className="stat-period">
        <div className="stat-period-header">
          <span>{label}{subLabel}</span>
          <span>{rank}</span>
        </div>
        <div className="stat-item">
          <span>Matches Played:</span>
          <strong>{played}</strong>
        </div>
        <div className="stat-item">
          <span>Wins:</span>
          <strong>{wins}</strong>
        </div>
        <div className="stat-item">
          <span>Draws:</span>
          <strong>{draws}</strong>
        </div>
        <div className="stat-item">
          <span>Losses:</span>
          <strong>{loses}</strong>
        </div>
        <div className="stat-item">
          <span>Goals For / Against:</span>
          <strong>{goalsFor} / {goalsAgainst}</strong>
        </div>
        <div className="stat-item">
          <span>Form:</span>
          <strong>{form}</strong>
        </div>
      </div>
    );
  };

  const sections = [
    renderBlock('2021 Season', stats.season2021),
    renderBlock('2022 Pre-Match', stats.season2022PreMatch)
  ].filter(Boolean);

  return sections.length ? (
    <div className="stat-periods">{sections}</div>
  ) : (
    <p>Statistics not available</p>
  );
}

export default function MatchInfo({ fixture, homeStats, awayStats }) {
  return (
    <div className="match-info">
      <div className="match-header">
        {fixture.teams.home.name} vs {fixture.teams.away.name}
      </div>
      {isSampleFixture(fixture) && (
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <span className="sample-pill" style={{ fontSize: '1em', padding: '6px 12px' }}>
            Sample Fixture Data
          </span>
        </div>
      )}
      <div style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
        {formatDate(fixture.fixture.date)} | {fixture.fixture.venue.name}
      </div>
      <div className="team-stats">
        <div className="team-stat-box">
          <h4>{fixture.teams.home.name} (Home)</h4>
          {formatTeamStats(homeStats)}
        </div>
        <div className="team-stat-box">
          <h4>{fixture.teams.away.name} (Away)</h4>
          {formatTeamStats(awayStats)}
        </div>
      </div>
    </div>
  );
}
