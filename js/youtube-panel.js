/**
 * Wine Media Hub — YouTube Panel
 */

const YouTubePanel = {
  videos: [],
  grid: null,
  categorySelect: null,

  async init() {
    this.grid = document.getElementById('youtube-grid');
    this.categorySelect = document.getElementById('youtube-category');

    this.categorySelect.addEventListener('change', () => this.render());

    const data = await App.fetchData('data/youtube.json');
    if (!data || !data.videos) {
      App.renderError(this.grid, 'Could not load videos. Data may not be available yet.');
      return;
    }

    this.videos = data.videos;
    this.render();
  },

  render() {
    const category = this.categorySelect.value;
    const filtered = category === 'All'
      ? this.videos
      : this.videos.filter(v => v.categories.includes(category));

    if (filtered.length === 0) {
      this.grid.innerHTML = '<div class="loading">No videos found for this category.</div>';
      return;
    }

    this.grid.innerHTML = filtered.map(video => this.renderCard(video)).join('');
  },

  renderCard(video) {
    const title = App.escapeHtml(video.title);
    const channel = App.escapeHtml(video.channel);
    const date = App.formatDate(video.publishedAt);
    const thumbnail = App.escapeHtml(video.thumbnail || '');
    const url = App.escapeHtml(video.url);

    const badges = video.categories
      .map(c => `<span class="category-badge">${App.escapeHtml(c)}</span>`)
      .join('');

    return `
      <div class="video-card">
        <a href="${url}" target="_blank" rel="noopener noreferrer">
          <img class="thumbnail" src="${thumbnail}" alt="${title}" loading="lazy">
        </a>
        <div class="video-info">
          <div class="video-title">
            <a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>
          </div>
          <div class="video-channel">${channel}</div>
          <div class="video-date">${date}</div>
          <div class="category-badges">${badges}</div>
        </div>
      </div>
    `;
  }
};
