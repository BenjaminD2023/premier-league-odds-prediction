# Premier League Odds Prediction Website

An AI-powered web application that demonstrates how modern Large Language Models (LLMs) can predict Premier League betting odds and compares their accuracy against actual bookmaker odds.

## 🚀 Features

- **Live Fixture Data**: Fetches upcoming Premier League matches from API-Football
- **AI-Powered Predictions**: Uses OpenAI's GPT-4 to analyze team statistics and generate betting odds
- **Accuracy Comparison**: Compares AI predictions with actual betting odds to show LLM accuracy
- **Beautiful UI**: Modern, responsive web interface with real-time updates
- **Team Statistics**: Displays comprehensive team stats including form, goals, and records

## 📋 Prerequisites

Before running this application, you'll need:

1. **Node.js** (version 14 or higher)
   - Node.js 18+ is recommended for built-in fetch API support
   - The app currently uses node-fetch v2 for compatibility
2. **API-Football API Key** from RapidAPI
3. **OpenAI API Key** from OpenAI Platform

## 🔑 Getting API Keys

### API-Football (Sports Data)

1. Go to [RapidAPI - API-Football](https://rapidapi.com/api-sports/api/api-football)
2. Sign up for a free account
3. Subscribe to the API (free tier available with 100 requests/day)
4. Copy your RapidAPI key from the dashboard

### OpenAI (LLM Predictions)

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your account
3. Navigate to API keys section
4. Create a new API key
5. Copy the key (you won't be able to see it again)

**Note**: OpenAI API requires billing to be set up. GPT-4 costs approximately $0.03 per prediction.

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/BenjaminD2023/premier-league-odds-prediction.git
cd premier-league-odds-prediction
```

2. Install dependencies:
```bash
npm install
```

3. Configure your API keys:
```bash
cp .env.example .env
```

4. Edit the `.env` file and add your API keys:
```env
# API-Football Configuration
FOOTBALL_API_KEY=your_api_football_key_here
FOOTBALL_API_HOST=api-football-v1.p.rapidapi.com

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3000
```

## 🚀 Running the Application

Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

## 📖 How to Use

1. **Check API Status**: The homepage displays whether your API keys are configured correctly
2. **Load Fixtures**: Click "Load Upcoming Fixtures" to fetch the next Premier League matches
3. **Select a Match**: Click on any fixture card to view detailed team statistics
4. **Generate AI Prediction**: Click "Generate AI Prediction" to let the LLM analyze the match and predict odds
5. **Load Actual Odds**: Click "Load Actual Odds" to fetch bookmaker odds (or enter them manually)
6. **View Comparison**: The system automatically compares AI predictions with actual odds and displays accuracy metrics

## 🏗️ Project Structure

```
premier-league-odds-prediction/
├── api/
│   ├── football.js       # API-Football integration
│   └── prediction.js     # OpenAI LLM integration
├── public/
│   ├── index.html        # Main webpage
│   ├── css/
│   │   └── style.css     # Styles
│   └── js/
│       └── app.js        # Frontend JavaScript
├── server.js             # Express server
├── package.json          # Dependencies
├── .env.example          # Environment variables template
└── README.md             # This file
```

## 🔌 API Endpoints

### Football Data
- `GET /api/football/fixtures` - Get upcoming fixtures
- `GET /api/football/fixture/:id` - Get specific fixture details
- `GET /api/football/teams/:id/statistics` - Get team statistics
- `GET /api/football/standings` - Get league standings
- `GET /api/football/odds/:fixtureId` - Get betting odds

### AI Predictions
- `POST /api/prediction/predict` - Generate LLM odds prediction
- `POST /api/prediction/compare` - Compare predictions with actual odds

### Health Check
- `GET /api/health` - Check API configuration status

## 🎨 Customization

### Using Different LLM Providers

The application uses OpenAI GPT-4 by default, but you can easily switch to other providers:

#### Anthropic Claude
1. Uncomment the `ANTHROPIC_API_KEY` in `.env`
2. Modify `api/prediction.js` to use Anthropic's API instead

#### Alternative Models
You can change the model in `api/prediction.js`:
```javascript
model: 'gpt-4'  // Change to 'gpt-3.5-turbo' for lower costs
```

### Styling
All styles are in `public/css/style.css`. The design uses CSS custom properties (variables) for easy theming:
```css
:root {
    --primary-color: #38003c;    /* Premier League purple */
    --secondary-color: #e90052;  /* Premier League pink */
    --success-color: #00ff87;
    /* ... */
}
```

## 📊 API Usage Limits

### API-Football (Free Tier)
- 100 requests per day
- Each page load uses 1-3 requests
- Each prediction uses 2-3 requests

### OpenAI GPT-4
- Pay-per-use pricing (~$0.03 per prediction)
- No hard limits, just billing

## 🐛 Troubleshooting

### "Football API key not configured"
- Make sure you've created a `.env` file (not just `.env.example`)
- Verify your API key is correct
- Check that there are no extra spaces or quotes around the key

### "OpenAI API error"
- Ensure billing is set up in your OpenAI account
- Verify your API key is valid
- Check your API usage limits

### No fixtures loading
- Verify API-Football key is correct
- Check your RapidAPI subscription is active
- Ensure you haven't exceeded daily request limits

### Predictions not working
- Make sure OpenAI API key is configured
- Verify billing is enabled on your OpenAI account
- Check API quota hasn't been exceeded

## 📝 License

MIT License - feel free to use this project for learning and demonstration purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the API documentation:
   - [API-Football Docs](https://www.api-football.com/documentation-v3)
   - [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
3. Open an issue in the GitHub repository

## 🎯 Future Enhancements

Potential features to add:
- Historical accuracy tracking
- Multiple LLM comparison (GPT-4 vs Claude vs Gemini)
- More detailed statistics and visualizations
- Prediction history and performance metrics
- Support for multiple leagues
- User authentication and saved predictions
- Real-time odds updates

---

**Disclaimer**: This application is for educational and demonstration purposes only. Predictions are based on AI analysis and should not be used for actual betting decisions.