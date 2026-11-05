/* Recreate original CMS-driven related lists against captured JSON only. */
(() => {
  'use strict';
  const root = new URL(document.body.dataset.appRoot || './', location.href);
  const cache = new Map();
  const swedish = document.documentElement.lang === 'sv';
  const strings = { en: 'Load more', sv: 'Ladda fler', no: 'Last flere', da: 'Indlæs mere' };
  function data(key) {
    if (!cache.has(key)) cache.set(key, fetch(new URL(`data/archives/${key}.json`, root), { signal: AbortSignal.timeout(20000) }).then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }).catch(error => { cache.delete(key); throw error; }));
    return cache.get(key);
  }
  document.querySelectorAll('[data-source-archive]').forEach(section => {
    const first = section.querySelector('.card');
    if (!first) return;
    const template = first.parentElement.cloneNode(true);
    const grid = first.parentElement.parentElement;
    const button = section.querySelector('[data-source-more]');
    const controls = [...section.querySelectorAll('[data-source-filter]')];
    const pageSize = Number(section.dataset.sourcePageSize) || 9;
    const categories = JSON.parse(section.dataset.sourceCategories || '{}');
    const selected = JSON.parse(section.dataset.sourceSelection || '[]');
    const excluded = section.dataset.sourceExclude.split(/[, ]+/);
    let limit = pageSize;
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.className = 'py-3';
    status.hidden = true;
    grid.after(status);
    async function render() {
      section.setAttribute('aria-busy', 'true');
      try {
        const source = await data(section.dataset.sourceArchive);
        let records = source.filter(item => (!selected.length || selected.includes(String(item.id))) && !excluded.includes(String(item.id)) && Object.entries(categories).every(([name, values]) => !values.length || values.some(value => item.terms[name]?.includes(value))));
        records = records.filter(item => controls.every(control => !control.value || Object.values(item.terms).some(values => values.includes(control.value))));
        const ascending = /asc/i.test(section.dataset.sourceSort);
        records.sort((a, b) => a.date.localeCompare(b.date) * (ascending ? 1 : -1));
        const fragment = document.createDocumentFragment();
        for (const item of records.slice(0, limit)) {
          const clone = template.cloneNode(true);
          clone.hidden = false;
          clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
          const heading = clone.querySelector('h2,h3,h4,.card-title');
          if (heading) heading.textContent = item.title;
          clone.querySelectorAll('a[href]').forEach(link => {
            link.href = new URL(item.url.replace(/^\//, '').replace(/\/?$/, '/') + 'index.html', root).href;
            const label = link.querySelector('.visually-hidden');
            if (label) label.textContent = item.title;
            link.setAttribute('aria-label', item.title);
          });
          const image = clone.querySelector('img');
          if (image && item.image) { image.src = new URL(item.image, root).href; image.alt = item.alt; image.removeAttribute('srcset'); }
          else if (image) image.remove();
          const subtitle = clone.querySelector('.card-subtitle');
          if (subtitle) {
            const type = subtitle.textContent.split('|')[0].trim();
            subtitle.textContent = `${type}${item.date ? ' | ' + item.date.slice(0, 10) : ''}`;
          }
          fragment.append(clone);
        }
        grid.replaceChildren(fragment);
        status.hidden = records.length > 0;
        status.textContent = swedish ? 'Inga träffar.' : 'No results.';
        if (button) {
          button.hidden = section.dataset.sourceHideMore === 'true' || records.length <= limit;
          const label = document.createElement('span');
          label.textContent = `${strings[document.documentElement.lang] || strings.en} (${Math.max(0, records.length - limit)})`;
          button.replaceChildren(label);
        }
      } catch (error) {
        status.hidden = false;
        status.textContent = `${swedish ? 'Listan kunde inte laddas. Försök igen.' : 'This list could not load. Please try again.'} (${error.message})`;
      } finally { section.removeAttribute('aria-busy'); }
    }
    button?.addEventListener('click', () => { limit += pageSize; render(); });
    controls.forEach(control => control.addEventListener('change', () => { limit = pageSize; render(); }));
    new IntersectionObserver((entries, observer) => {
      if (entries.some(entry => entry.isIntersecting)) { render(); observer.disconnect(); }
    }, { rootMargin: '300px' }).observe(section);
  });
})();
