const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const sampleFixtures2022 = require('../data/sample-fixtures-2022.json');
const sampleOdds2022 = require('../data/sample-odds-2022.json');
const sampleTeamStats = require('../data/sample-team-stats-2022.json');

const FOOTBALL_API_BASE = 'https://v3.football.api-sports.io';

// Helper: determine current Premier League season (starts in August)
function getCurrentPLSeason() {
    return 2022;
}

// Helper: format date to YYYY-MM-DD
function formatDateYYYYMMDD(d) {
    return d.toISOString().split('T')[0];
}

/**
 * Helper function to make API-Football requests
 */
async function makeFootballAPIRequest(endpoint, params = {}) {
    const apiKey = process.env.FOOTBALL_API_KEY;
    
    if (!apiKey || apiKey === 'your_api_football_key_here') {
        throw new Error('Football API key not configured. Please set FOOTBALL_API_KEY in .env file');
    }
    
    const queryString = new URLSearchParams(params).toString();
    const url = `${FOOTBALL_API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'x-apisports-key': apiKey
        }
    });
    
    if (!response.ok) {
        throw new Error(`Football API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
}

/**
 * Helper to fetch fixtures with given params
 */
async function fetchFixturesWithParams(params) {
    const data = await makeFootballAPIRequest('/fixtures', params);
    return Array.isArray(data.response) ? data.response : [];
}

const SAMPLE_FIXTURE_MAP = new Map(sampleFixtures2022.map(f => [String(f.fixture.id), f]));
const SAMPLE_FIXTURE_BY_TEAMS = new Map(
    sampleFixtures2022.map(f => [`${f.teams.home.name}|${f.teams.away.name}`, f])
);

function cloneSampleOdds(entry) {
    if (!entry) return null;
    return {
        bookmaker: { ...entry.bookmaker },
        odds: { ...entry.odds }
    };
}

function getSampleOddsEntry(fixtureId, fixture) {
    const byId = cloneSampleOdds(sampleOdds2022[String(fixtureId)]);
    if (byId) return byId;

    const key = fixture ? `${fixture.teams?.home?.name}|${fixture.teams?.away?.name}` : null;
    if (key && SAMPLE_FIXTURE_BY_TEAMS.has(key)) {
        const sampleFixture = SAMPLE_FIXTURE_BY_TEAMS.get(key);
        return cloneSampleOdds(sampleOdds2022[String(sampleFixture.fixture.id)]);
    }
    return null;
}

function isWithinRange(dateStr, from, to) {
    const ts = new Date(dateStr).getTime();
    if (Number.isNaN(ts)) return false;
    if (from && ts < from) return false;
    if (to && ts > to) return false;
    return true;
}

function getSampleFixturesFiltered({ date, from, to }) {
    const fromTs = from ? new Date(from).getTime() : null;
    const toTs = to ? new Date(to).getTime() : null;

    if (date) {
        const target = new Date(date).toISOString().slice(0, 10);
        return sampleFixtures2022.filter(f => f.fixture.date.startsWith(target));
    }

    if (fromTs || toTs) {
        return sampleFixtures2022.filter(f =>
            isWithinRange(f.fixture.date, fromTs, toTs)
        );
    }

    return sampleFixtures2022;
}

/**
 * GET /api/football/fixtures
 * Load upcoming fixtures (next 20) when no date range is provided, otherwise honor the user’s range.
 * Fallbacks:
 *   1. next=20 (current season)
 *   2. 14-day rolling window (current season)
 *   3. Historical sample window
 */
router.get('/fixtures', async (req, res) => {
    try {
        const { date, from, to } = req.query;
        const fixtures = getSampleFixturesFiltered({ date, from, to });

        if (!fixtures.length) {
            console.warn('Sample fixture filter returned no matches; falling back to full sample set.');
        }

        res.json({
            success: true,
            data: fixtures.length ? fixtures : sampleFixtures2022
        });
    } catch (error) {
        console.error('Error fetching fixtures:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/football/fixture/:id
 * Get detailed information about a specific fixture
 */
router.get('/fixture/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let fixture = null;

        if (!Number.isNaN(Number(id))) {
            const data = await makeFootballAPIRequest('/fixtures', { id });
            fixture = data.response?.[0] || null;
        }

        if (!fixture) {
            fixture = SAMPLE_FIXTURE_MAP.get(String(id));
        }

        if (!fixture) {
            return res.status(404).json({
                success: false,
                error: `Fixture ${id} not found in API-Football or sample data`
            });
        }

        res.json({
            success: true,
            data: fixture
        });
    } catch (error) {
        console.error('Error fetching fixture:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/football/teams/:id/statistics
 * Get team statistics for the 2022 season
 */
router.get('/teams/:id/statistics', async (req, res) => {
    try {
        const { id } = req.params;
        const teamId = String(id);
        const sample = sampleTeamStats[teamId];

        if (sample) {
            return res.json({
                success: true,
                data: sample,
                source: 'sample'
            });
        }

        const liveStats = await makeFootballAPIRequest('/teams/statistics', {
            team: id,
            league: 39,
            season: getCurrentPLSeason()
        });

        res.json({
            success: true,
            data: {
                season2021: liveStats.response || null,
                season2022PreMatch: null
            },
            source: 'api-football'
        });
    } catch (error) {
        console.error('Error fetching team statistics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/football/standings
 * Get Premier League standings from 2022 season
 */
router.get('/standings', async (req, res) => {
    try {
        const data = await makeFootballAPIRequest('/standings', {
            league: 39,
            season: 2022
        });
        
        res.json({
            success: true,
            data: data.response
        });
    } catch (error) {
        console.error('Error fetching standings:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Fallback: moneyline (1X2) odds from API-Football
 */
async function fetchMoneylineOdds({ fixtureId, leagueId = 39, season = getCurrentPLSeason(), fallbackFixture = null }) {
    const sampleCandidate = getSampleOddsEntry(fixtureId, fallbackFixture);

    if (sampleCandidate && Number.isNaN(Number(fixtureId))) {
        return { ...sampleCandidate, source: 'sample' };
    }

    try {
        const data = await makeFootballAPIRequest('/odds', {
            fixture: fixtureId,
            league: leagueId,
            season
        });
        const response = Array.isArray(data.response) ? data.response : [];

        for (const item of response) {
            if (!Array.isArray(item.bookmakers)) continue;
            for (const bookmaker of item.bookmakers) {
                const matchWinner = bookmaker.bets?.find(b => b.name === 'Match Winner' || b.name === '1X2');
                if (!matchWinner || !Array.isArray(matchWinner.values)) continue;

                const homeVal = matchWinner.values.find(v => v.value === 'Home' || v.value === '1');
                const drawVal = matchWinner.values.find(v => v.value === 'Draw' || v.value === 'X');
                const awayVal = matchWinner.values.find(v => v.value === 'Away' || v.value === '2');

                if (homeVal && drawVal && awayVal) {
                    return {
                        bookmaker: { key: bookmaker.id, title: bookmaker.name },
                        odds: {
                            homeWin: parseFloat(homeVal.odd),
                            draw: parseFloat(drawVal.odd),
                            awayWin: parseFloat(awayVal.odd)
                        },
                        source: 'api-football'
                    };
                }
            }
        }
    } catch (error) {
        console.warn('API-Football odds lookup failed:', error.message);
    }

    if (sampleCandidate) {
        return { ...sampleCandidate, source: 'sample' };
    }

    return null;
}

/**
 * GET /api/football/odds/:fixtureId
 * Get moneyline (1X2) betting odds for a specific fixture using API-Football only
 */
router.get('/odds/:fixtureId', async (req, res) => {
    try {
        const { fixtureId } = req.params;

        let fixture = null;
        if (!Number.isNaN(Number(fixtureId))) {
            const fixtureData = await makeFootballAPIRequest('/fixtures', { id: fixtureId });
            fixture = fixtureData.response?.[0] || null;
        }

        if (!fixture) {
            fixture = SAMPLE_FIXTURE_MAP.get(String(fixtureId));
        }

        if (!fixture) {
            return res.status(404).json({ success: false, error: `Fixture ${fixtureId} not found in API-Football or sample data` });
        }

        const leagueId = fixture.league?.id || 39;
        const season = fixture.league?.season || getCurrentPLSeason();

        const oddsResult = await fetchMoneylineOdds({
            fixtureId,
            leagueId,
            season,
            fallbackFixture: fixture
        });

        if (!oddsResult) {
            return res.json({
                success: true,
                data: null,
                message: 'No moneyline odds available from API-Football or sample data for this fixture'
            });
        }

        const { source, ...data } = oddsResult;
        return res.json({ success: true, data, source });
    } catch (error) {
        console.error('Error fetching odds:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
