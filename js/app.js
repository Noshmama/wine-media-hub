/**
 * Wine Media Hub — Shared utilities and initialization
 */

const App = {
  /**
   * Fetch JSON data with error handling
   */
  async fetchData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error(`Failed to fetch ${url}:`, err);
      return null;
    }
  },

  /**
   * Format an ISO date string to a readable format
   */
  formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Render an error message into a container
   */
  renderError(container, message) {
    container.innerHTML = `<div class="error-message">${App.escapeHtml(message)}</div>`;
  }
};

// Initialize both panels and modal once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  YouTubePanel.init();
  PodcastPanel.init();

  // About Me modal
  const modal = document.getElementById('about-modal');
  const openBtn = document.getElementById('about-btn');
  const closeBtn = document.getElementById('modal-close');

  openBtn.addEventListener('click', () => modal.classList.add('open'));
  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });
});
