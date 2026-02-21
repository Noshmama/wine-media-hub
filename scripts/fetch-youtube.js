const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.YOUTUBE_API_KEY;
if (!API_KEY) {
  console.error('Error: YOUTUBE_API_KEY environment variable is not set.');
  process.exit(1);
}

const youtube = google.youtube({ version: 'v3', auth: API_KEY });

const CATEGORIES = {
  'Business & Trade': [
    'wine business',
    'wine industry',
    'wine trade',
    'wine market'
  ],
  'Connoisseur & Tasting': [
    'wine tasting',
    'sommelier',
    'wine review',
    'wine pairing'
  ],
  'Wines by Region': [
    'French wine',
    'Italian wine',
    'Napa Valley wine',
    'Rioja wine',
    'Burgundy wine'
  ],
  'Grape Varieties': [
    'Cabernet Sauvignon wine',
    'Pinot Noir wine',
    'Chardonnay wine',
    'Merlot wine',
    'Riesling wine'
  ],
  'Winemaking & Viticulture': [
    'winemaking process',
    'viticulture',
    'wine harvest',
    'wine fermentation',
    'natural wine'
  ],
  'Wine Collecting & Investment': [
    'wine collecting',
    'wine auction',
    'wine cellar',
    'wine investment'
  ],
  'Wine & Food': [
    'cooking with wine',
    'wine dinner pairing',
    'restaurant wine list',
    'wine and cheese'
  ],
  'Wine Education': [
    'WSET wine',
    'wine certification',
    'sommelier exam',
    'wine school'
  ],
  'Sustainability & Climate': [
    'organic wine',
    'biodynamic wine',
    'climate change wine',
    'sustainable vineyard'
  ],
  'Emerging Wine Regions': [
    'Georgian wine',
    'English sparkling wine',
    'Chinese wine',
    'Croatian wine'
  ],
  'Wineries': [
    'winery tour',
    'winery visit',
    'best wineries',
    'winery behind the scenes'
  ]
};

const MAX_RESULTS_PER_QUERY = 10;

async function searchVideos(query) {
  const response = await youtube.search.list({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: MAX_RESULTS_PER_QUERY,
    order: 'date',
    relevanceLanguage: 'en',
    safeSearch: 'moderate'
  });
  return response.data.items || [];
}

async function fetchAllVideos() {
  const allVideos = new Map(); // keyed by videoId for deduplication

  for (const [category, queries] of Object.entries(CATEGORIES)) {
    console.log(`\nFetching category: ${category}`);

    for (const query of queries) {
      console.log(`  Searching: "${query}"`);
      try {
        const items = await searchVideos(query);

        for (const item of items) {
          const videoId = item.id.videoId;
          if (allVideos.has(videoId)) {
            // Add category to existing video if not already present
            const existing = allVideos.get(videoId);
            if (!existing.categories.includes(category)) {
              existing.categories.push(category);
            }
            continue;
          }

          allVideos.set(videoId, {
            videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            publishedAt: item.snippet.publishedAt,
            description: item.snippet.description,
            categories: [category],
            url: `https://www.youtube.com/watch?v=${videoId}`
          });
        }

        console.log(`    Found ${items.length} results`);
      } catch (err) {
        console.error(`    Error searching "${query}": ${err.message}`);
      }
    }
  }

  return Array.from(allVideos.values());
}

async function main() {
  console.log('Wine Media Hub — YouTube Video Fetcher');
  console.log('======================================');

  const videos = await fetchAllVideos();

  // Sort by publish date (newest first)
  videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const output = {
    lastUpdated: new Date().toISOString(),
    totalVideos: videos.length,
    videos
  };

  const outPath = path.join(__dirname, '..', 'data', 'youtube.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\nDone! Saved ${videos.length} videos to data/youtube.json`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
