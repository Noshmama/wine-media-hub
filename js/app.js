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
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Render an error message into a container
   */
  renderError(container, message) {
    container.innerHTML = `<div class="error-message">${App.escapeHtml(message)}</div>`;
  },

  /** Shared IntersectionObserver — loads images when they scroll into view */
  imageObserver: null,
  initImageObserver() {
    if (this.imageObserver) return;
    this.imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          this.imageObserver.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });
  },

  /** Observe a single image element for lazy loading */
  observeImage(img) {
    if (this.imageObserver) {
      this.imageObserver.observe(img);
    }
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

  // Contact form toggle and submission
  const contactToggle = document.getElementById('contact-toggle');
  const contactForm = document.getElementById('contact-form');
  const contactStatus = document.getElementById('contact-status');

  contactToggle.addEventListener('click', () => {
    const showing = contactForm.style.display === 'none';
    contactForm.style.display = showing ? 'block' : 'none';
    contactToggle.textContent = showing ? 'Hide contact form' : 'Get in touch';
  });

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = contactForm.querySelector('.contact-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    contactStatus.textContent = '';

    const addr = ['nosh', 'mama', '@', 'ya', 'hoo', '.com'].join('');
    const formData = new FormData(contactForm);

    try {
      const resp = await fetch('https://formsubmit.co/ajax/' + addr, {
        method: 'POST',
        body: formData
      });
      if (resp.ok) {
        contactStatus.textContent = 'Message sent! Thank you.';
        contactStatus.style.color = '#2e7d32';
        contactForm.reset();
      } else {
        throw new Error('Send failed');
      }
    } catch {
      contactStatus.textContent = 'Could not send. Please try again.';
      contactStatus.style.color = '#c62828';
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
  });

  // Industry Analyses modal
  const analysesModal = document.getElementById('analyses-modal');
  const analysesBtn = document.getElementById('analyses-btn');
  const analysesClose = document.getElementById('analyses-modal-close');

  analysesBtn.addEventListener('click', () => analysesModal.classList.add('open'));
  analysesClose.addEventListener('click', () => analysesModal.classList.remove('open'));
  analysesModal.addEventListener('click', (e) => {
    if (e.target === analysesModal) analysesModal.classList.remove('open');
  });
});
