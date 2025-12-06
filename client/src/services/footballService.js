import axios from 'axios';

const FOOTBALL_API_BASE = 'https://v3.football.api-sports.io';
const FOOTBALL_API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY;

// Sample data URLs
const SAMPLE_FIXTURES_URL = '/data/sample-fixtures-2022.json';
const SAMPLE_ODDS_URL = '/data/sample-odds-2022.json';
const SAMPLE_STATS_URL = '/data/sample-team-stats-2022.json';

// Load sample data
let sampleFixtures = null;
let sampleOdds = null;
let sampleTeamStats = null;

async function loadSampleData() {
  if (!sampleFixtures) {
    const response = await axios.get(SAMPLE_FIXTURES_URL);
    sampleFixtures = response.data;
  }
  if (!sampleOdds) {
    const response = await axios.get(SAMPLE_ODDS_URL);
    sampleOdds = response.data;
  }
  if (!sampleTeamStats) {
    const response = await axios.get(SAMPLE_STATS_URL);
    sampleTeamStats = response.data;
  }
}

function hasFootballApiKey() {
  return !!(FOOTBALL_API_KEY && FOOTBALL_API_KEY !== 'your_api_football_key_here');
}

async function makeFootballAPIRequest(endpoint, params = {}) {
  if (!hasFootballApiKey()) {
    throw new Error('Football API key not configured. Please set VITE_FOOTBALL_API_KEY in .env file');
  }

  const queryString = new URLSearchParams(params).toString();
  const url = `${FOOTBALL_API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;

  const response = await axios.get(url, {
    headers: {
      'x-apisports-key': FOOTBALL_API_KEY
    }
  });

  return response.data;
}

export async function getFixtures(params = {}) {
  try {
    await loadSampleData();
    
    // Always return sample data for demo purposes
    const { date, from, to } = params;
    let filtered = sampleFixtures;
    
    if (date) {
      const target = new Date(date).toISOString().slice(0, 10);
      filtered = sampleFixtures.filter(f => f.fixture.date.startsWith(target));
    } else if (from || to) {
      const fromTs = from ? new Date(from).getTime() : null;
      const toTs = to ? new Date(to).getTime() : null;
      filtered = sampleFixtures.filter(f => {
        const ts = new Date(f.fixture.date).getTime();
        if (fromTs && ts < fromTs) return false;
        if (toTs && ts > toTs) return false;
        return true;
      });
    }
    
    return {
      success: true,
      data: filtered.length ? filtered : sampleFixtures
    };
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getFixtureById(id) {
  try {
    await loadSampleData();
    
    const fixture = sampleFixtures.find(f => String(f.fixture.id) === String(id));
    
    if (!fixture) {
      return {
        success: false,
        error: `Fixture ${id} not found`
      };
    }
    
    return {
      success: true,
      data: fixture
    };
  } catch (error) {
    console.error('Error fetching fixture:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getTeamStatistics(teamId) {
  try {
    await loadSampleData();
    
    const stats = sampleTeamStats[String(teamId)];
    
    if (stats) {
      return {
        success: true,
        data: stats,
        source: 'sample'
      };
    }
    
    // If no sample data, return empty stats
    return {
      success: true,
      data: null,
      source: 'none'
    };
  } catch (error) {
    console.error('Error fetching team statistics:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getOdds(fixtureId) {
  try {
    await loadSampleData();
    
    const oddsEntry = sampleOdds[String(fixtureId)];
    
    if (oddsEntry && oddsEntry.odds) {
      return {
        success: true,
        data: {
          bookmaker: oddsEntry.bookmaker,
          odds: oddsEntry.odds
        },
        source: 'sample'
      };
    }
    
    return {
      success: true,
      data: null,
      message: 'No odds available for this fixture'
    };
  } catch (error) {
    console.error('Error fetching odds:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function checkAPIStatus() {
  return {
    hasFootballApiKey: hasFootballApiKey()
  };
}
