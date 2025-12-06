export function convertDecimalToAmerican(dec) {
  if (!isFinite(dec) || dec <= 1) return 'N/A';
  if (dec >= 2) return `+${Math.round((dec - 1) * 100)}`;
  return `-${Math.round(100 / (dec - 1))}`;
}

export function formatMoneylineWithProbability(dec) {
  if (!isFinite(dec) || dec <= 1) return 'N/A';
  const american = convertDecimalToAmerican(dec);
  const implied = (1 / dec * 100).toFixed(1);
  return `${american} (${dec.toFixed(2)} | ${implied}%)`;
}

export function isSampleFixture(fixture) {
  return isNaN(Number(fixture?.fixture?.id));
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function summarizeSeasonStats(period) {
  if (!period) return null;
  const wins = period.fixtures?.wins?.total ?? 0;
  const draws = period.fixtures?.draws?.total ?? 0;
  const loses = period.fixtures?.loses?.total ?? 0;

  return {
    season: period.league?.season ?? 'N/A',
    rank: period.league?.rank ?? 'N/A',
    form: period.form || 'N/A',
    goalsFor: period.goals?.for?.total?.total ?? 0,
    goalsAgainst: period.goals?.against?.total?.total ?? 0,
    record: `${wins}W-${draws}D-${loses}L`
  };
}

export function buildStatsPayload(rawStats) {
  return {
    season2021: summarizeSeasonStats(rawStats?.season2021),
    season2022PreMatch: summarizeSeasonStats(rawStats?.season2022PreMatch)
  };
}
