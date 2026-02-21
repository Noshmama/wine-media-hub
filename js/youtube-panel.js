/**
 * Wine Media Hub — YouTube Panel
 * Renders all cards once, then filters by toggling CSS visibility.
 */

const YouTubePanel = {
  videos: [],
  grid: null,
  categorySelect: null,

  async init() {
    this.grid = document.getElementById('youtube-grid');
    this.categorySelect = document.getElementById('youtube-category');

    this.categorySelect.addEventListener('change', () => this.filterCards());

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
    this.buildCards();
  },

  openVideo(videoId) {
    const modal = document.getElementById('video-modal');
    const embed = document.getElementById('video-embed');
    embed.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    modal.classList.add('open');
  },

  /** Build all cards once and attach event listeners */
  buildCards() {
    if (this.videos.length === 0) {
      this.grid.innerHTML = '<div class="loading">No videos found.</div>';
      return;
    }

    const fragment = document.createDocumentFragment();

    this.videos.forEach(video => {
      const card = document.createElement('div');
      card.className = 'video-card';
      card.dataset.categories = video.categories.join('|');

      const title = App.escapeHtml(video.title);
      const channel = App.escapeHtml(video.channel);
      const date = App.formatDate(video.publishedAt);
      const thumbnail = App.escapeHtml(video.thumbnail || '');
      const videoId = App.escapeHtml(video.videoId);

      const badges = video.categories
        .map(c => `<span class="category-badge">${App.escapeHtml(c)}</span>`)
        .join('');

      card.innerHTML = `
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
      `;

      card.querySelectorAll('[data-video-id]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          this.openVideo(el.dataset.videoId);
        });
      });

      fragment.appendChild(card);
    });

    this.grid.innerHTML = '';
    this.grid.appendChild(fragment);
  },

  /** Show/hide cards based on selected category — no DOM rebuild */
  filterCards() {
    const category = this.categorySelect.value;
    const cards = this.grid.children;

    let visibleCount = 0;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card.dataset.categories) continue;
      const show = category === 'All' || card.dataset.categories.split('|').includes(category);
      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    }

    // Handle empty state
    let emptyMsg = this.grid.querySelector('.empty-message');
    if (visibleCount === 0) {
      if (!emptyMsg) {
        emptyMsg = document.createElement('div');
        emptyMsg.className = 'loading empty-message';
        emptyMsg.textContent = 'No videos found for this category.';
        this.grid.appendChild(emptyMsg);
      }
      emptyMsg.style.display = '';
    } else if (emptyMsg) {
      emptyMsg.style.display = 'none';
    }
  }
};
