import React from 'react';
import { formatDate, isSampleFixture } from '../utils/helpers';

export default function FixturesList({ fixtures, selectedFixtureId, onSelectFixture }) {
  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="fixtures-section">
        <h2>Upcoming Fixtures</h2>
        <div className="fixtures-container">
          <p className="placeholder">No upcoming fixtures found.</p>
        </div>
      </div>
    );
  }

  const hasSampleData = fixtures.some(isSampleFixture);

  return (
    <div className="fixtures-section">
      {hasSampleData && (
        <div className="sample-banner">
          📚 Displaying curated sample fixtures, statistics, and odds for demo purposes.
        </div>
      )}
      <h2>Upcoming Fixtures</h2>
      <div className="fixtures-container">
        {fixtures.map((fixture) => (
          <div
            key={fixture.fixture.id}
            className={`fixture-card ${selectedFixtureId === fixture.fixture.id ? 'selected' : ''}`}
            onClick={() => onSelectFixture(fixture)}
          >
            <div className="fixture-date">{formatDate(fixture.fixture.date)}</div>
            <div className="fixture-teams">
              {fixture.teams.home.name} vs {fixture.teams.away.name}
            </div>
            <div className="fixture-venue">
              {fixture.fixture.venue.name}
              {isSampleFixture(fixture) && <span className="sample-pill">Sample</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
