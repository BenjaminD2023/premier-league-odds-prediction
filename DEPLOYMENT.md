# Deployment Guide for GitHub Pages

This guide will help you deploy the Premier League Odds Prediction React app to GitHub Pages.

## Prerequisites

Before deploying, make sure you have:
1. A GitHub repository for this project
2. API keys for API-Football and Qwen API

## Step 1: Set Up GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret** and add the following secrets:

   - **Name**: `VITE_FOOTBALL_API_KEY`
     - **Value**: Your API-Football API key
   
   - **Name**: `VITE_QWEN_API_KEY`
     - **Value**: Your Qwen API key from Alibaba Cloud

## Step 2: Enable GitHub Pages

1. Go to your repository's **Settings**
2. Scroll down to **Pages** in the left sidebar
3. Under **Build and deployment**:
   - **Source**: Select "GitHub Actions"

## Step 3: Deploy

### Option A: Automatic Deployment (Recommended)

Simply push your code to the `main` branch:

```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically:
1. Build your React app
2. Deploy it to GitHub Pages
3. Make it available at `https://[your-username].github.io/premier-league-odds-prediction/`

### Option B: Manual Deployment

From the `client` directory, run:

```bash
npm run deploy
```

This will:
1. Build the production version
2. Deploy to the `gh-pages` branch
3. Make it available on GitHub Pages

## Step 4: Verify Deployment

1. Go to **Actions** tab in your repository
2. Check if the deployment workflow completed successfully
3. Visit your GitHub Pages URL: `https://[your-username].github.io/premier-league-odds-prediction/`

## Troubleshooting

### Deployment Failed

**Check the Actions tab** for error messages:

1. Go to the **Actions** tab
2. Click on the failed workflow run
3. Review the error logs

Common issues:
- **Missing secrets**: Make sure both API keys are added as repository secrets
- **Build errors**: Check that the app builds locally with `npm run build`
- **Permissions**: Ensure GitHub Actions has write permissions (Settings > Actions > General > Workflow permissions)

### App Not Loading

**Check these common issues:**

1. **Base URL**: Verify `vite.config.js` has the correct base path:
   ```javascript
   base: '/premier-league-odds-prediction/',
   ```

2. **API Keys**: Make sure they're properly set in repository secrets

3. **Browser Console**: Check for any JavaScript errors

### API Keys Not Working

If the app shows "API key not configured":

1. **For local development**: Create a `.env` file in the `client` directory:
   ```
   VITE_FOOTBALL_API_KEY=your_key_here
   VITE_QWEN_API_KEY=your_key_here
   ```

2. **For GitHub Pages**: Verify secrets are set correctly in repository settings

## Updating the Deployment

To update your deployed site:

1. Make your changes
2. Commit and push to `main`:
   ```bash
   git add .
   git commit -m "Update app"
   git push origin main
   ```
3. The GitHub Actions workflow will automatically rebuild and redeploy

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to `client/public/` with your domain name
2. Configure DNS settings with your domain provider
3. In GitHub Settings > Pages, add your custom domain

## Monitoring

- **Check deployment status**: Visit the Actions tab
- **View logs**: Click on any workflow run for detailed logs
- **Check site**: Visit your GitHub Pages URL regularly

## Local Testing Before Deployment

Always test locally before deploying:

```bash
cd client
npm run build
npm run preview
```

Visit `http://localhost:4173/premier-league-odds-prediction/` to test the production build.

## Need Help?

- Check the [main README](../client/README.md) for more details
- Review [GitHub Pages documentation](https://docs.github.com/en/pages)
- Review [Vite deployment documentation](https://vitejs.dev/guide/static-deploy.html#github-pages)
