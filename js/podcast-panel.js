/**
 * Wine Media Hub — Podcast Panel
 */

const PodcastPanel = {
  podcasts: [],
  grid: null,
  categorySelect: null,

  async init() {
    this.grid = document.getElementById('podcast-grid');
    this.categorySelect = document.getElementById('podcast-category');

    this.categorySelect.addEventListener('change', () => this.render());

    const data = await App.fetchData('data/podcasts.json');
    if (!data || !data.podcasts) {
      App.renderError(this.grid, 'Could not load podcasts. Data may not be available yet.');
      return;
    }

    this.podcasts = data.podcasts;
    this.render();
  },

  render() {
    const category = this.categorySelect.value;
    const filtered = category === 'All'
      ? this.podcasts
      : this.podcasts.filter(p => p.categories.includes(category));

    if (filtered.length === 0) {
      this.grid.innerHTML = '<div class="loading">No podcasts found for this category.</div>';
      return;
    }

    this.grid.innerHTML = filtered.map((podcast, idx) => this.renderCard(podcast, idx)).join('');

    // Attach toggle listeners for episode lists
    this.grid.querySelectorAll('.episodes-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const list = btn.nextElementSibling;
        const isOpen = list.classList.toggle('open');
        btn.textContent = isOpen
          ? 'Hide episodes'
          : `Show ${list.children.length} recent episodes`;
      });
    });

    // Clicking podcast name or artwork also toggles episodes
    this.grid.querySelectorAll('.podcast-card').forEach(card => {
      const toggle = card.querySelector('.episodes-toggle');
      if (!toggle) return;

      card.querySelectorAll('.artwork, .podcast-name-link').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', (e) => {
          e.preventDefault();
          toggle.click();
        });
      });
    });
  },

  renderCard(podcast, idx) {
    const name = App.escapeHtml(podcast.name);
    const author = App.escapeHtml(podcast.author);
    const artwork = App.escapeHtml(podcast.artwork || '');
    const description = App.escapeHtml(podcast.description || '');

    const badges = podcast.categories
      .map(c => `<span class="category-badge">${App.escapeHtml(c)}</span>`)
      .join('');

    const episodes = (podcast.episodes || []);
    let episodesHtml = '';

    if (episodes.length > 0) {
      const episodeItems = episodes.map(ep => {
        const epTitle = App.escapeHtml(ep.title);
        const epDate = App.formatDate(ep.pubDate);
        const audioUrl = ep.audioUrl ? App.escapeHtml(ep.audioUrl) : '';

        return `
          <div class="episode-item">
            <div class="episode-title">${epTitle}</div>
            <div class="episode-date">${epDate}${ep.duration ? ' &middot; ' + App.escapeHtml(ep.duration) : ''}</div>
            ${audioUrl ? `<audio controls preload="none" src="${audioUrl}"></audio>` : ''}
          </div>
        `;
      }).join('');

      episodesHtml = `
        <button class="episodes-toggle">Show ${episodes.length} recent episodes</button>
        <div class="episodes-list">${episodeItems}</div>
      `;
    }

    return `
      <div class="podcast-card">
        <div class="podcast-top">
          <img class="artwork" src="${artwork}" alt="${name}" loading="lazy">
          <div class="podcast-info">
            <div class="podcast-name">
              <a href="#" class="podcast-name-link">${name}</a>
            </div>
            <div class="podcast-author">${author}</div>
            <div class="podcast-description">${description}</div>
            <div class="category-badges">${badges}</div>
          </div>
        </div>
        ${episodesHtml}
      </div>
    `;
  }
};
