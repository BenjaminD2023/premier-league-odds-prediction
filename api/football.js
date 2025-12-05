const express = require('express');
const router = express.Router();

// Use node-fetch v2 for compatibility with CommonJS
const fetch = require('node-fetch');

// API-Football base configuration
const FOOTBALL_API_BASE = 'https://api-football-v1.p.rapidapi.com/v3';

/**
 * Helper function to make API-Football requests
 */
async function makeFootballAPIRequest(endpoint, params = {}) {
    const apiKey = process.env.FOOTBALL_API_KEY;
    const apiHost = process.env.FOOTBALL_API_HOST || 'api-football-v1.p.rapidapi.com';
    
    if (!apiKey || apiKey === 'your_api_football_key_here') {
        throw new Error('Football API key not configured. Please set FOOTBALL_API_KEY in .env file');
    }
    
    const queryString = new URLSearchParams(params).toString();
    const url = `${FOOTBALL_API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': apiHost
        }
    });
    
    if (!response.ok) {
        throw new Error(`Football API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
}

/**
 * GET /api/football/fixtures
 * Get upcoming Premier League fixtures
 */
router.get('/fixtures', async (req, res) => {
    try {
        const { date, next } = req.query;
        
        // Premier League ID is 39
        const params = {
            league: 39,
            season: new Date().getFullYear()
        };
        
        if (date) {
            params.date = date;
        } else if (next) {
            params.next = next;
        } else {
            // Default to next 10 matches
            params.next = 10;
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
 * Get team statistics for the current season
 */
router.get('/teams/:id/statistics', async (req, res) => {
    try {
        const { id } = req.params;
        
        const data = await makeFootballAPIRequest('/teams/statistics', {
            team: id,
            league: 39,
            season: new Date().getFullYear()
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
 * Get current Premier League standings
 */
router.get('/standings', async (req, res) => {
    try {
        const data = await makeFootballAPIRequest('/standings', {
            league: 39,
            season: new Date().getFullYear()
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
