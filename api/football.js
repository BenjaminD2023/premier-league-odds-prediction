const express = require('express');
const router = express.Router();

// Use node-fetch v2 for compatibility with CommonJS
const fetch = require('node-fetch');

// API-Football base configuration
const FOOTBALL_API_BASE = 'https://v3.football.api-sports.io';

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
 * GET /api/football/fixtures
 * Get Premier League fixtures from 2022 season
 */
router.get('/fixtures', async (req, res) => {
    try {
        const { date } = req.query;
        
        // Premier League ID is 39, using 2022 season for historical data
        const params = {
            league: 39,
            season: 2022
        };
        
        if (date) {
            params.date = date;
        } else {
            // Get fixtures from a specific date range in 2022 season
            // Fetching from October 2022 to get mid-season matches with good data
            params.from = '2022-10-01';
            params.to = '2022-10-31';
        }
        
        const data = await makeFootballAPIRequest('/fixtures', params);
        
        res.json({
            success: true,
            data: data.response
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
        
        const data = await makeFootballAPIRequest('/fixtures', { id });
        
        res.json({
            success: true,
            data: data.response[0]
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
        
        const data = await makeFootballAPIRequest('/teams/statistics', {
            team: id,
            league: 39,
            season: 2022
        });
        
        res.json({
            success: true,
            data: data.response
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
 * GET /api/football/odds/:fixtureId
 * Get betting odds for a specific fixture
 */
router.get('/odds/:fixtureId', async (req, res) => {
    try {
        const { fixtureId } = req.params;
        
        const data = await makeFootballAPIRequest('/odds', {
            fixture: fixtureId
        });
        
        res.json({
            success: true,
            data: data.response
        });
    } catch (error) {
        console.error('Error fetching odds:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
