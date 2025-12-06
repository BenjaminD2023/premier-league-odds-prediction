# Quick Start Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Get Your API Keys

### API-Football (Required)
1. Visit: https://www.api-football.com/
2. Create an account and choose a plan (free tier includes 100 requests/day)
3. Copy your API key from the dashboard
4. The key must have access to the `/fixtures`, `/teams/statistics`, and `/odds` endpoints

### Qwen (Required)
1. Visit: https://dashscope.aliyun.com/
2. Create an API key

## Step 3: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and replace the placeholder values:
# - Replace 'your_api_football_key_here' with your API-Football key
# - Replace 'your_qwen_api_key_here' with your Qwen key
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
QWEN_API_KEY=sk-demo-123...
PORT=3000
```
