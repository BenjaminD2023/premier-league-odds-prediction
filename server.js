const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/api/', limiter); // Apply rate limiting to API routes

// Import API routes
const footballAPI = require('./api/football');
const predictionAPI = require('./api/prediction');

// Routes
app.use('/api/football', footballAPI);
app.use('/api/prediction', predictionAPI);

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Premier League Odds Prediction API is running',
        hasFootballApiKey: !!process.env.FOOTBALL_API_KEY && process.env.FOOTBALL_API_KEY !== 'your_api_football_key_here',
        hasOpenAiKey: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('\n🔑 API Key Status:');
    console.log(`   Football API: ${process.env.FOOTBALL_API_KEY && process.env.FOOTBALL_API_KEY !== 'your_api_football_key_here' ? '✓ Configured' : '✗ Not configured'}`);
    console.log(`   OpenAI API: ${process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' ? '✓ Configured' : '✗ Not configured'}`);
    console.log('\n📝 Configure your API keys in the .env file');
    console.log('   Copy .env.example to .env and add your keys\n');
});

module.exports = app;
