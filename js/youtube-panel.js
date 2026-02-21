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

    // Video player modal
    const modal = document.getElementById('video-modal');
    const closeBtn = document.getElementById('video-modal-close');
    const embed = document.getElementById('video-embed');

    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
      embed.innerHTML = '';
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
        embed.innerHTML = '';
      }
    });

    const data = await App.fetchData('data/youtube.json');
    if (!data || !data.videos) {
      App.renderError(this.grid, 'Could not load videos. Data may not be available yet.');
      return;
    }

    this.videos = data.videos;
    this.render();
  },

  openVideo(videoId) {
    const modal = document.getElementById('video-modal');
    const embed = document.getElementById('video-embed');
    embed.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    modal.classList.add('open');
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

    // Attach click handlers for inline play
    this.grid.querySelectorAll('[data-video-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.openVideo(el.dataset.videoId);
      });
    });
  },

  renderCard(video) {
    const title = App.escapeHtml(video.title);
    const channel = App.escapeHtml(video.channel);
    const date = App.formatDate(video.publishedAt);
    const thumbnail = App.escapeHtml(video.thumbnail || '');
    const videoId = App.escapeHtml(video.videoId);

    const badges = video.categories
      .map(c => `<span class="category-badge">${App.escapeHtml(c)}</span>`)
      .join('');

    return `
      <div class="video-card">
        <a href="#" data-video-id="${videoId}">
          <img class="thumbnail" src="${thumbnail}" alt="${title}" loading="lazy">
        </a>
        <div class="video-info">
          <div class="video-title">
            <a href="#" data-video-id="${videoId}">${title}</a>
          </div>
          <div class="video-channel">${channel}</div>
          <div class="video-date">${date}</div>
          <div class="category-badges">${badges}</div>
        </div>
      </div>
    `;
  }
};
