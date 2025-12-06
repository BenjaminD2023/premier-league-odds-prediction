# Premier League Odds Prediction Website (React + GitHub Pages)

An AI-powered web application built with React that demonstrates how modern Large Language Models (LLMs) can predict Premier League **moneyline (1X2)** betting odds and compares their accuracy against actual bookmaker odds.

## 🚀 Features

- **Live Fixture Data**: Uses sample Premier League match data for demo purposes
- **Automatic Moneyline Odds**: Displays home/draw/away moneyline odds in American (+/-) format
- **AI-Powered Predictions**: Uses Alibaba Cloud's Qwen LLM to analyze team statistics and generate moneyline betting odds
- **Accuracy Comparison**: Compares AI predictions with actual moneyline odds to show LLM accuracy
- **Beautiful UI**: Modern, responsive React interface with real-time updates
- **Team Statistics**: Displays comprehensive team stats including form, goals, and records
- **GitHub Pages Deployment**: Fully static site deployable to GitHub Pages

## 🛠️ Technology Stack

- **Frontend**: React 19 with Vite
- **Styling**: Custom CSS with CSS Variables
- **HTTP Client**: Axios
- **APIs**: API-Football (fixtures & odds), Alibaba Cloud Qwen (AI predictions)
- **Deployment**: GitHub Pages with GitHub Actions

## 📋 Prerequisites

Before running this application, you'll need:

1. **Node.js** (version 18 or higher recommended)
2. **API-Football API Key** – for fixtures, statistics, and moneyline odds
3. **Qwen API Key** from Alibaba Cloud DashScope – for AI predictions

## 🔑 Getting API Keys

### API-Football (Sports Data & Odds)

1. Go to [API-Football](https://www.api-football.com/)
2. Sign up for a free account
3. Subscribe to a plan (free tier available with 100 requests/day)
4. Copy your API key from the dashboard

### Qwen API (LLM Predictions)

1. Go to [Alibaba Cloud DashScope](https://dashscope.aliyun.com/)
2. Sign up or log in to your Alibaba Cloud account
3. Navigate to the API keys section
4. Create a new API key
5. Copy the key for use in your application

## 🛠️ Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/BenjaminD2023/premier-league-odds-prediction.git
cd premier-league-odds-prediction
```

2. Navigate to the client directory:
```bash
cd client
```

3. Install dependencies:
```bash
npm install
```

4. Configure your API keys:
```bash
cp .env.example .env
```

5. Edit the `.env` file and add your API keys:
```env
VITE_FOOTBALL_API_KEY=your_api_football_key_here
VITE_QWEN_API_KEY=your_qwen_api_key_here
```

6. Start the development server:
```bash
npm run dev
```

7. Open your browser and navigate to:
```
http://localhost:5173
```

## 📦 Building for Production

To create a production build:

```bash
cd client
npm run build
```

This will create a `dist` folder with optimized production files.

To preview the production build locally:

```bash
npm run preview
```

## 🚀 Deploying to GitHub Pages

### Option 1: Using GitHub Actions (Recommended)

1. **Set up GitHub Secrets**:
   - Go to your GitHub repository
   - Navigate to Settings > Secrets and variables > Actions
   - Add the following secrets:
     - `VITE_FOOTBALL_API_KEY`: Your API-Football key
     - `VITE_QWEN_API_KEY`: Your Qwen API key

2. **Enable GitHub Pages**:
   - Go to Settings > Pages
   - Under "Build and deployment", select "GitHub Actions" as the source

3. **Push to main branch**:
   - The GitHub Actions workflow will automatically build and deploy your app
   - Your site will be available at: `https://yourusername.github.io/premier-league-odds-prediction/`

### Option 2: Manual Deployment

```bash
cd client
npm run deploy
```

This will build the app and deploy it to the `gh-pages` branch.

## 📖 How to Use

1. **Check API Status**: The homepage displays whether your API keys are configured correctly
2. **Load Fixtures**: Click "Load Upcoming Fixtures" to fetch Premier League matches
3. **Select a Match**: Click on any fixture card to view detailed team statistics
4. **Generate AI Prediction**: Click "Generate AI Moneyline" to let the LLM analyze the match and predict moneyline odds
5. **Load Actual Odds**: Click "Load Actual Moneyline Odds" to fetch bookmaker odds from API-Football  
   - If no odds are available for that fixture, you'll be prompted to enter odds manually as a fallback
6. **View Comparison**: The system automatically compares AI moneyline predictions with actual bookmaker odds and displays accuracy metrics
7. **Ask Follow-up Questions**: Use the "Ask the AI Why" chat to get deeper insights into the predictions

## 🏗️ Project Structure

```
premier-league-odds-prediction/
├── client/                      # React application
│   ├── public/
│   │   └── data/               # Sample data files
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── APIStatus.jsx
│   │   │   ├── LoadingOverlay.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   ├── FixturesList.jsx
│   │   │   ├── MatchInfo.jsx
│   │   │   ├── PredictionDisplay.jsx
│   │   │   ├── ActualOddsDisplay.jsx
│   │   │   ├── AIChat.jsx
│   │   │   └── ComparisonResults.jsx
│   │   ├── services/           # API service layers
│   │   │   ├── footballService.js
│   │   │   └── predictionService.js
│   │   ├── utils/              # Utility functions
│   │   │   └── helpers.js
│   │   ├── App.jsx             # Main App component
│   │   ├── App.css             # Styles
│   │   ├── index.css           # Global styles
│   │   └── main.jsx            # Entry point
│   ├── .env.example            # Environment variables template
│   ├── package.json
│   └── vite.config.js          # Vite configuration
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── api/                        # Legacy backend (not used in React version)
├── server.js                   # Legacy server (not used in React version)
└── README.md                   # This file
```

## 🎨 Customization

### Using Different LLM Providers

The application uses Alibaba Cloud's Qwen by default. You can modify `client/src/services/predictionService.js` to use other LLM providers.

### Qwen Model Selection

You can switch between **qwen-turbo**, **qwen3-max**, and **qwen3-8b** directly from the UI before generating predictions.

### Styling

All styles are in `client/src/App.css`. The design uses CSS custom properties (variables) for easy theming:

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
- Make sure you've created a `.env` file in the `client` directory (not just `.env.example`)
- Verify your API key is correct
- Check that there are no extra spaces or quotes around the key
- For GitHub Pages deployment, ensure you've added the secret to your repository

### "Qwen API error"
- Ensure your Alibaba Cloud account is verified
- Verify your API key is valid
- Check your API usage limits and quota

### No fixtures loading
- The app uses sample data for demonstration
- Sample fixtures are always available as fallback

### Predictions not working
- Make sure Qwen API key is configured
- Verify your Alibaba Cloud account is active
- Check API quota hasn't been exceeded

### GitHub Pages deployment not working
- Verify that GitHub Pages is enabled in repository settings
- Check that the GitHub Actions workflow has the necessary permissions
- Ensure API keys are added as repository secrets
- Check the Actions tab for build/deployment errors

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
- Mobile app version

---

**Disclaimer**: This application is for educational and demonstration purposes only. Predictions are based on AI analysis and should not be used for actual betting decisions.
