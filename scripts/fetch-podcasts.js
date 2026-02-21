const RSSParser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const rssParser = new RSSParser();

const CATEGORIES = {
  'Business & Trade': [
    'wine business',
    'wine trade',
    'wine industry'
  ],
  'Connoisseur & Tasting': [
    'wine tasting',
    'sommelier',
    'wine connoisseur'
  ],
  'Wines by Region': [
    'wine regions',
    'world wine'
  ],
  'Grape Varieties': [
    'wine varietals',
    'grape varieties wine'
  ],
  'Winemaking & Viticulture': [
    'winemaking',
    'viticulture',
    'natural wine'
  ],
  'Wine Collecting & Investment': [
    'wine collecting',
    'wine investment',
    'fine wine'
  ],
  'Wine & Food': [
    'wine and food',
    'wine pairing dinner'
  ],
  'Wine Education': [
    'wine education',
    'WSET wine',
    'sommelier training'
  ],
  'Sustainability & Climate': [
    'sustainable wine',
    'organic wine',
    'climate change wine'
  ],
  'Emerging Wine Regions': [
    'new wine regions',
    'emerging wine'
  ]
};

const MAX_RESULTS_PER_QUERY = 10;
const MAX_EPISODES_PER_PODCAST = 5;

async function searchITunes(query) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=podcast&limit=${MAX_RESULTS_PER_QUERY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`iTunes API error: ${response.status}`);
  }
  const data = await response.json();
  return data.results || [];
}

async function fetchRSSEpisodes(feedUrl) {
  try {
    const feed = await rssParser.parseURL(feedUrl);
    const episodes = (feed.items || []).slice(0, MAX_EPISODES_PER_PODCAST).map(item => ({
      title: item.title || 'Untitled Episode',
      pubDate: item.pubDate || item.isoDate || null,
      duration: item.itunes?.duration || null,
      audioUrl: item.enclosure?.url || null,
      description: item.contentSnippet || item.content || ''
    }));
    return episodes;
  } catch (err) {
    console.error(`    Failed to parse RSS feed: ${err.message}`);
    return [];
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAllPodcasts() {
  const allPodcasts = new Map(); // keyed by collectionId for deduplication

  for (const [category, queries] of Object.entries(CATEGORIES)) {
    console.log(`\nFetching category: ${category}`);

    for (const query of queries) {
      console.log(`  Searching: "${query}"`);
      try {
        const results = await searchITunes(query);

        for (const result of results) {
          const podcastId = result.collectionId;
          if (!podcastId) continue;

          if (allPodcasts.has(podcastId)) {
            const existing = allPodcasts.get(podcastId);
            if (!existing.categories.includes(category)) {
              existing.categories.push(category);
            }
            continue;
          }

          allPodcasts.set(podcastId, {
            podcastId,
            name: result.collectionName || result.trackName || 'Unknown Podcast',
            author: result.artistName || 'Unknown',
            artwork: result.artworkUrl600 || result.artworkUrl100 || result.artworkUrl60 || '',
            description: result.description || '',
            feedUrl: result.feedUrl || '',
            iTunesUrl: result.collectionViewUrl || '',
            categories: [category],
            episodes: [] // populated later
          });
        }

        console.log(`    Found ${results.length} results`);
        // Be respectful to the iTunes API
        await sleep(500);
      } catch (err) {
        console.error(`    Error searching "${query}": ${err.message}`);
      }
    }
  }

  return allPodcasts;
}

async function enrichWithEpisodes(podcastsMap) {
  const podcasts = Array.from(podcastsMap.values());
  console.log(`\nFetching episodes for ${podcasts.length} podcasts...`);

  for (const podcast of podcasts) {
    if (!podcast.feedUrl) {
      console.log(`  Skipping "${podcast.name}" (no feed URL)`);
      continue;
    }

    console.log(`  Fetching episodes: "${podcast.name}"`);
    podcast.episodes = await fetchRSSEpisodes(podcast.feedUrl);
    // Be respectful to RSS hosts
    await sleep(300);
  }

  return podcasts;
}

async function main() {
  console.log('Wine Media Hub — Podcast Fetcher');
  console.log('================================');

  const podcastsMap = await fetchAllPodcasts();
  const podcasts = await enrichWithEpisodes(podcastsMap);

  // Sort by name
  podcasts.sort((a, b) => a.name.localeCompare(b.name));

  const output = {
    lastUpdated: new Date().toISOString(),
    totalPodcasts: podcasts.length,
    podcasts
  };

  const outPath = path.join(__dirname, '..', 'data', 'podcasts.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\nDone! Saved ${podcasts.length} podcasts to data/podcasts.json`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
