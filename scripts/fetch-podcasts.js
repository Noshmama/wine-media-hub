const RSSParser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const rssParser = new RSSParser({
  timeout: 10000, // 10-second timeout per feed
});

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
  ],
  'Wineries': [
    'winery podcast',
    'winery tour',
    'winery stories'
  ]
};

const MAX_RESULTS_PER_QUERY = 10;
const MAX_EPISODES_PER_PODCAST = 5;

// Blocklist: podcast names that aren't about wine
const NAME_BLOCKLIST = [
  /28 da(ys|tes) later/i,
  /movie/i,
  /film review/i,
];

function isPodcastBlocked(name) {
  for (const pattern of NAME_BLOCKLIST) {
    if (pattern.test(name)) return true;
  }
  return false;
}

async function searchITunes(query) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=podcast&limit=${MAX_RESULTS_PER_QUERY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`iTunes API error: ${response.status}`);
  }
  const data = await response.json();
  return data.results || [];
}

async function fetchWithTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
  });
  try {
    const result = await Promise.race([promise, timeout]);
    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function fetchRSSEpisodes(feedUrl) {
  try {
    const feed = await fetchWithTimeout(rssParser.parseURL(feedUrl), 15000);
    const episodes = (feed.items || []).slice(0, MAX_EPISODES_PER_PODCAST).map(item => ({
      title: item.title || 'Untitled Episode',
      pubDate: item.pubDate || item.isoDate || null,
      duration: item.itunes?.duration || null,
      audioUrl: item.enclosure?.url || null
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
  const seenNames = new Set(); // deduplicate by name too

  for (const [category, queries] of Object.entries(CATEGORIES)) {
    console.log(`\nFetching category: ${category}`);

    for (const query of queries) {
      console.log(`  Searching: "${query}"`);
      try {
        const results = await searchITunes(query);

        for (const result of results) {
          const podcastId = result.collectionId;
          if (!podcastId) continue;

          const podcastName = result.collectionName || result.trackName || '';
          if (isPodcastBlocked(podcastName)) {
            console.log(`    Blocked: "${podcastName}"`);
            continue;
          }

          const nameLower = podcastName.toLowerCase().trim();
          if (seenNames.has(nameLower)) {
            console.log(`    Skipping duplicate name: "${podcastName}"`);
            continue;
          }

          if (allPodcasts.has(podcastId)) {
            const existing = allPodcasts.get(podcastId);
            if (!existing.categories.includes(category)) {
              existing.categories.push(category);
            }
            continue;
          }

          seenNames.add(nameLower);
          allPodcasts.set(podcastId, {
            name: result.collectionName || result.trackName || 'Unknown Podcast',
            author: result.artistName || 'Unknown',
            artwork: result.artworkUrl600 || result.artworkUrl100 || result.artworkUrl60 || '',
            description: result.description || '',
            feedUrl: result.feedUrl || '',
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

const MAX_PODCASTS_TO_ENRICH = 100;

async function enrichWithEpisodes(podcastsMap) {
  const podcasts = Array.from(podcastsMap.values());
  const toEnrich = podcasts.filter(p => p.feedUrl).slice(0, MAX_PODCASTS_TO_ENRICH);
  console.log(`\nFetching episodes for ${toEnrich.length} of ${podcasts.length} podcasts (cap: ${MAX_PODCASTS_TO_ENRICH})...`);

  let succeeded = 0;
  let failed = 0;

  for (const podcast of toEnrich) {
    console.log(`  Fetching episodes: "${podcast.name}"`);
    podcast.episodes = await fetchRSSEpisodes(podcast.feedUrl);
    if (podcast.episodes.length > 0) {
      succeeded++;
    } else {
      failed++;
    }
    await sleep(300);
  }

  // Podcasts beyond the cap get empty episodes
  for (const podcast of podcasts) {
    if (!podcast.episodes) podcast.episodes = [];
  }

  console.log(`\n  Episode fetch complete: ${succeeded} succeeded, ${failed} failed/empty`);
  return podcasts;
}

async function main() {
  console.log('Wine Media Hub — Podcast Fetcher');
  console.log('================================');

  const podcastsMap = await fetchAllPodcasts();
  const podcasts = await enrichWithEpisodes(podcastsMap);

  // Sort by name
  podcasts.sort((a, b) => a.name.localeCompare(b.name));

  // Strip fields only needed during fetch (feedUrl), not displayed on the site
  const cleanPodcasts = podcasts.map(({ feedUrl, ...rest }) => rest);

  const output = {
    lastUpdated: new Date().toISOString(),
    totalPodcasts: cleanPodcasts.length,
    podcasts: cleanPodcasts
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
