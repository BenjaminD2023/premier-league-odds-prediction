# Quick Start Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Get Your API Keys

### API-Football (Required)
1. Visit: https://rapidapi.com/api-sports/api/api-football
2. Click "Subscribe to Test"
3. Choose a plan (Basic free plan includes 100 requests/day)
4. Go to "Endpoints" and you'll see your API key in the code snippet
5. Copy the `X-RapidAPI-Key` value

### OpenAI (Required)
1. Visit: https://platform.openai.com/api-keys
2. Sign in or create an account
3. Set up billing (required for API access)
4. Click "Create new secret key"
5. Copy the key immediately (you can't view it again)

## Step 3: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and replace the placeholder values:
# - Replace 'your_api_football_key_here' with your RapidAPI key
# - Replace 'your_openai_api_key_here' with your OpenAI key
```

## Step 4: Run the Application

```bash
npm start
```

Visit http://localhost:3000 in your browser

## Verification

The homepage will show API status:
- ✓ Configured (green) = API key is set correctly
- ✗ Not Configured (red) = API key needs to be added to .env

## Tips

- **Start with Manual Odds**: If you don't want to use API-Football's odds endpoint (which may cost more), you can enter odds manually
- **Cost Management**: GPT-4 costs ~$0.03 per prediction. Consider using GPT-3.5-turbo for cheaper predictions
- **API Limits**: Free API-Football plan has 100 requests/day. Each prediction uses 2-3 requests.

## Common Issues

### Issue: "Cannot find module 'express'"
**Solution**: Run `npm install`

### Issue: API keys not working
**Solution**: 
- Make sure you created `.env` (not just renamed `.env.example`)
- No quotes around the keys in .env file
- No extra spaces or line breaks

### Issue: OpenAI billing error
**Solution**: Go to https://platform.openai.com/account/billing and add payment method

## Example .env File

```env
FOOTBALL_API_KEY=abc123def456ghi789
FOOTBALL_API_HOST=api-football-v1.p.rapidapi.com
OPENAI_API_KEY=sk-proj-abc123...
PORT=3000
```
