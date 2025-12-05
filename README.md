# Premier League Odds Prediction Website

An AI-powered web application that demonstrates how modern Large Language Models (LLMs) can predict Premier League betting odds in moneyline (American) format and compares their accuracy against actual bookmaker odds.

## 🚀 Features

- **Live Fixture Data**: Fetches upcoming Premier League matches from API-Football
- **AI-Powered Predictions**: Uses Alibaba Cloud's Qwen LLM to analyze team statistics and generate betting odds in moneyline format
- **Moneyline Odds Format**: Displays all odds in American moneyline format (+150, -200, etc.)
- **Accuracy Comparison**: Compares AI predictions with actual betting odds to show LLM accuracy
- **Beautiful UI**: Modern, responsive web interface with real-time updates
- **Team Statistics**: Displays comprehensive team stats including form, goals, and records

## 📋 Prerequisites

Before running this application, you'll need:

1. **Node.js** (version 14 or higher)
   - Node.js 18+ is recommended for built-in fetch API support
   - The app currently uses node-fetch v2 for compatibility
2. **API-Football API Key** (direct access, not through RapidAPI)
3. **Qwen API Key** from Alibaba Cloud DashScope

## 🔑 Getting API Keys

### API-Football (Sports Data)

1. Go to [API-Football](https://www.api-football.com/)
2. Sign up for a free account
3. Subscribe to a plan (free tier available with 100 requests/day)
4. Copy your API key from the dashboard
5. **Note**: Use direct API-Football access, not through RapidAPI

### Qwen API (LLM Predictions)

1. Go to [Alibaba Cloud DashScope](https://dashscope.aliyun.com/)
2. Sign up or log in to your Alibaba Cloud account
3. Navigate to the API keys section
4. Create a new API key
5. Copy the key for use in your application

**Note**: Qwen API may require account verification. Check their pricing and usage limits.

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

# Qwen API Configuration
QWEN_API_KEY=your_qwen_api_key_here

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
4. **Generate AI Prediction**: Click "Generate AI Prediction" to let the LLM analyze the match and predict odds in moneyline format
5. **Load Actual Odds**: Click "Load Actual Odds" to fetch bookmaker odds from the API (converted to moneyline) or enter them manually in moneyline format (+150, -200, etc.)
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
- `POST /api/prediction/predict` - Generate LLM odds prediction (using Qwen)
- `POST /api/prediction/compare` - Compare predictions with actual odds

### Health Check
- `GET /api/health` - Check API configuration status

## 🎨 Customization

### Using Different LLM Providers

The application uses Alibaba Cloud's Qwen by default, but you can modify `api/prediction.js` to use other LLM providers if needed.

### Qwen Model Selection
You can change the Qwen model in `api/prediction.js`:
```javascript
model: 'qwen-turbo'  // Options: 'qwen-turbo', 'qwen-plus', 'qwen-max'
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

### Qwen API
- Varies by plan and model selected
- Check [DashScope pricing](https://dashscope.aliyun.com/) for details
- Free tier available with limitations

## 🐛 Troubleshooting

### "Football API key not configured"
- Make sure you've created a `.env` file (not just `.env.example`)
- Verify your API key is correct
- Check that there are no extra spaces or quotes around the key

### "Qwen API error"
- Ensure your Alibaba Cloud account is verified
- Verify your API key is valid
- Check your API usage limits and quota

### No fixtures loading
- Verify API-Football key is correct (use direct API key, not RapidAPI)
- Check your API-Football subscription is active
- Ensure you haven't exceeded daily request limits

### Predictions not working
- Make sure Qwen API key is configured
- Verify your Alibaba Cloud account is active
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
   - [Qwen API Docs](https://help.aliyun.com/zh/dashscope/)
3. Open an issue in the GitHub repository

## 🎯 Future Enhancements

Potential features to add:
- Historical accuracy tracking
- Multiple LLM comparison (Qwen vs GPT vs Claude vs Gemini)
- More detailed statistics and visualizations
- Prediction history and performance metrics
- Support for multiple leagues
- User authentication and saved predictions
- Real-time odds updates

---

**Disclaimer**: This application is for educational and demonstration purposes only. Predictions are based on AI analysis and should not be used for actual betting decisions.