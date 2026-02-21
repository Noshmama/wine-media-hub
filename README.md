# Wine Media Hub

A single-page web app that displays wine-related YouTube videos and podcasts side by side in a split-screen layout. Content is fetched dynamically via APIs using a GitHub Actions scheduled workflow.

## Live Site

Enable GitHub Pages on this repo (Settings > Pages > Source: main branch, root directory) to deploy.

## Local Development

Open with any local server:

```bash
npx serve .
# or
python -m http.server 8000
```

Then visit `http://localhost:3000` (or `http://localhost:8000`).

## Updating Content

Content is updated automatically every Sunday via GitHub Actions. You can also trigger an update manually from the Actions tab.

To run the fetch scripts locally:

```bash
npm install
export YOUTUBE_API_KEY=your_key_here
node scripts/fetch-youtube.js
node scripts/fetch-podcasts.js
```

## YouTube API Key Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Wine Media Hub")
3. Navigate to **APIs & Services > Library**
4. Search for "YouTube Data API v3" and click **Enable**
5. Go to **APIs & Services > Credentials**
6. Click **Create Credentials > API Key**
7. (Recommended) Click **Restrict Key** — under "API restrictions", select "YouTube Data API v3"
8. Copy the API key
9. In your GitHub repo, go to **Settings > Secrets and variables > Actions**
10. Click **New repository secret**, name it `YOUTUBE_API_KEY`, paste the key

## Project Structure

```
wine-media-hub/
├── .github/workflows/
│   └── update-content.yml        # Scheduled GitHub Action (weekly)
├── scripts/
│   ├── fetch-youtube.js          # Fetches YouTube videos via Data API v3
│   └── fetch-podcasts.js         # Fetches podcasts via iTunes Search API + RSS
├── data/
│   ├── youtube.json              # Auto-generated video data
│   └── podcasts.json             # Auto-generated podcast data
├── index.html                    # Main page
├── css/
│   └── styles.css                # All styling
├── js/
│   ├── app.js                    # Initialization, shared utilities
│   ├── youtube-panel.js          # Left panel — YouTube video listing
│   └── podcast-panel.js          # Right panel — Podcast listing
└── README.md
```

## Categories

| Category | Description |
|---|---|
| Business & Trade | Wine industry news, market trends, DTC sales |
| Connoisseur & Tasting | Tasting techniques, sommelier tips, wine pairing |
| Wines by Region | French, Italian, Napa Valley, Rioja, Burgundy |
| Grape Varieties | Cabernet Sauvignon, Pinot Noir, Chardonnay, etc. |

## Tech Stack

- **Frontend**: Plain HTML/CSS/JS (no frameworks)
- **Data**: JSON files fetched at page load
- **APIs**: YouTube Data API v3, iTunes Search API, RSS feeds
- **CI/CD**: GitHub Actions (weekly scheduled workflow)
- **Hosting**: GitHub Pages
