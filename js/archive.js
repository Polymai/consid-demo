/* Captured archive records, filtering and pagination have no network mutation. */
(() => {
  'use strict';
  document.querySelectorAll('[data-button-filter]').forEach(section => {
    section.querySelectorAll('[data-category-filter]').forEach(button => {
      button.addEventListener('click', () => {
        section.querySelectorAll('[data-category-filter]').forEach(other => {
          other.classList.toggle('active', other === button);
          other.setAttribute('aria-pressed', String(other === button));
        });
        section.querySelectorAll('[data-category-item]').forEach(item => {
          item.hidden = !!button.dataset.categoryFilter && item.dataset.categoryItem !== button.dataset.categoryFilter;
        });
      });
    });
  });
  document.querySelectorAll('[data-job-filter]').forEach(filter => {
    filter.addEventListener('change', () => {
      filter.closest('section').querySelectorAll('[data-job-group]').forEach(group => {
        group.hidden = !!filter.value && group.dataset.jobGroup !== filter.value;
      });
    });
  });
  document.querySelectorAll('[data-local-archive]').forEach(section => {
    const items = [...section.querySelectorAll('[data-archive-item]')];
    const filters = [...section.querySelectorAll('[data-archive-filter]')];
    const more = section.querySelector('[data-archive-more]');
    const empty = section.querySelector('[data-archive-empty]');
    const size = Number(section.dataset.archivePageSize) || 9;
    let limit = size;
    function render() {
      let count = 0;
      for (const item of items) {
        const matched = filters.every(filter => {
          const value = filter.value.trim().toLowerCase();
          if (!value || value === 'all' || value === '0' || value === 'default') return true;
          if (filter.tagName !== 'SELECT') return item.textContent.toLowerCase().includes(value);
          return item.dataset.terms.split(' ').includes(value) || item.textContent.toLowerCase().includes(filter.selectedOptions[0]?.textContent.toLowerCase());
        });
        if (matched) count++;
        item.hidden = !matched || count > limit;
      }
      if (more) { more.hidden = count <= limit; more.disabled = false; }
      if (empty) empty.hidden = count !== 0;
    }
    filters.forEach(filter => filter.addEventListener(filter.tagName === 'SELECT' ? 'change' : 'input', () => { limit = size; render(); }));
    more?.addEventListener('click', () => { limit += size; render(); });
    render();
  });
})();
