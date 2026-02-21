/**
 * Wine Media Hub — Podcast Panel
 * Renders all cards once, then filters by toggling CSS visibility.
 */

const PodcastPanel = {
  podcasts: [],
  grid: null,
  categorySelect: null,

  async init() {
    this.grid = document.getElementById('podcast-grid');
    this.categorySelect = document.getElementById('podcast-category');

    this.categorySelect.addEventListener('change', () => this.filterCards());

    const data = await App.fetchData('data/podcasts.json');
    if (!data || !data.podcasts) {
      App.renderError(this.grid, 'Could not load podcasts. Data may not be available yet.');
      return;
    }

    this.podcasts = data.podcasts;
    this.buildCards();
  },

  /** Build all cards once and attach event listeners */
  buildCards() {
    if (this.podcasts.length === 0) {
      this.grid.innerHTML = '<div class="loading">No podcasts found.</div>';
      return;
    }

    const fragment = document.createDocumentFragment();

    this.podcasts.forEach(podcast => {
      const card = document.createElement('div');
      card.className = 'podcast-card';
      card.dataset.categories = podcast.categories.join('|');

      const name = App.escapeHtml(podcast.name);
      const author = App.escapeHtml(podcast.author);
      const artwork = App.escapeHtml(podcast.artwork || '');
      const description = App.escapeHtml(podcast.description || '');

      const badges = podcast.categories
        .map(c => `<span class="category-badge">${App.escapeHtml(c)}</span>`)
        .join('');

      const episodes = podcast.episodes || [];
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

      card.innerHTML = `
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
      `;

      // Attach episode toggle listener
      const toggle = card.querySelector('.episodes-toggle');
      if (toggle) {
        const list = card.querySelector('.episodes-list');

        toggle.addEventListener('click', () => {
          const isOpen = list.classList.toggle('open');
          toggle.textContent = isOpen
            ? 'Hide episodes'
            : `Show ${list.children.length} recent episodes`;
        });

        // Clicking artwork or name also toggles episodes
        card.querySelectorAll('.artwork, .podcast-name-link').forEach(el => {
          el.style.cursor = 'pointer';
          el.addEventListener('click', (e) => {
            e.preventDefault();
            toggle.click();
          });
        });
      }

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
        emptyMsg.textContent = 'No podcasts found for this category.';
        this.grid.appendChild(emptyMsg);
      }
      emptyMsg.style.display = '';
    } else if (emptyMsg) {
      emptyMsg.style.display = 'none';
    }
  }
};
