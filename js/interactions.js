/* Page-level motion, source carousels, local preferences and media controls. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const swedish = document.documentElement.lang === 'sv';
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('demo-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.05 });
  document.querySelectorAll('.word-animation-span').forEach(node => observer.observe(node));
  document.querySelectorAll('.card-scroll--container').forEach(container => {
    const wrapper = container.querySelector('.card-scroll--wrapper');
    if (!wrapper) return;
    const update = () => {
      const width = innerWidth < 768 ? innerWidth * 0.82 : innerWidth < 1200 ? innerWidth * 0.5 : 600;
      wrapper.style.setProperty('--card-width', `${width}px`);
      wrapper.style.setProperty('--card-wrapper-width', `${width * wrapper.children.length}px`);
    };
    update();
    new ResizeObserver(update).observe(container);
    const section = container.closest('section') || container.parentElement;
    section.querySelectorAll('button').forEach(button => {
      const text = `${button.textContent} ${button.getAttribute('aria-label') || ''}`.toLowerCase();
      if (!/next|previous|nästa|föregående|neste|forrige|næste/.test(text)) return;
      const forward = button.querySelector('.fa-angle-right') ? true : button.querySelector('.fa-angle-left') ? false : /next|nästa|neste|næste/.test(text);
      button.addEventListener('click', () => container.scrollBy({ left: (forward ? 1 : -1) * parseFloat(wrapper.style.getPropertyValue('--card-width')), behavior: reduced.matches ? 'instant' : 'smooth' }));
    });
    container.tabIndex = 0;
    container.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
      event.preventDefault();
      container.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * 320, behavior: reduced.matches ? 'instant' : 'smooth' });
    });
  });
  document.querySelectorAll('video[data-local-video]').forEach(video => {
    const container = video.closest('header,section,div.position-relative') || video.parentElement;
    const button = [...container.querySelectorAll('button')].find(b => b.querySelector('.fa-pause,.fa-play') || /^(pause|play|pausa|spela)$/i.test(b.textContent.trim()));
    function sync() {
      if (!button) return;
      button.setAttribute('aria-label', video.paused ? (swedish ? 'Spela' : 'Play') : (swedish ? 'Pausa' : 'Pause'));
      const icon = button.querySelector('i');
      if (icon) icon.className = `fa-regular ${video.paused ? 'fa-play' : 'fa-pause'}`;
    }
    button?.addEventListener('click', () => {
      if (video.paused) video.play().catch(() => { video.controls = true; });
      else video.pause();
      sync();
    });
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    video.addEventListener('timeupdate', () => {
      const progress = container.querySelector('[role="progressbar"]');
      const value = video.duration ? Math.min(100, video.currentTime / video.duration * 100) : 0;
      progress?.setAttribute('aria-valuenow', String(Math.round(value)));
      if (progress?.firstElementChild) progress.firstElementChild.style.width = `${value}%`;
    });
    video.addEventListener('error', () => {
      const note = document.createElement('p');
      note.className = 'demo-media-note';
      note.setAttribute('role', 'status');
      note.textContent = swedish ? 'Videon kan inte spelas. Stillbilden visas.' : 'Video unavailable. Showing the still image.';
      container.append(note);
      video.hidden = true;
    });
    if (reduced.matches) { video.removeAttribute('autoplay'); video.pause(); sync(); }
  });
  // Original Bootstrap-style accordions and tabs operate locally.
  document.addEventListener('click', event => {
    const button = event.target.closest('.accordion-button,[data-bs-toggle="collapse"]');
    if (button) {
      const id = button.getAttribute('aria-controls') || button.getAttribute('data-bs-target')?.replace(/^#/, '');
      const panel = id ? document.getElementById(id) : button.closest('.accordion-item')?.querySelector('.accordion-collapse');
      if (panel) {
        const open = !panel.classList.contains('show');
        panel.classList.toggle('show', open);
        button.classList.toggle('collapsed', !open);
        button.setAttribute('aria-expanded', String(open));
      }
    }
    const tab = event.target.closest('[role="tab"]');
    if (tab) {
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      const list = tab.closest('[role="tablist"]');
      if (panel && list) {
        list.querySelectorAll('[role="tab"]').forEach(item => {
          const selected = item === tab;
          item.classList.toggle('active', selected);
          item.setAttribute('aria-selected', String(selected));
          const target = document.getElementById(item.getAttribute('aria-controls'));
          if (target) { target.classList.toggle('active', selected); target.classList.toggle('show', selected); target.hidden = !selected; }
        });
      }
    }
    if (event.target.closest('[data-print]')) window.print();
    if (event.target.closest('.skip-to-content')) document.querySelector('main')?.focus();
  });
  const cookie = document.getElementById('demo-cookie-dialog');
  if (cookie) {
    const key = 'polymai:consid_demo:cookie-choice';
    const configUrl = new URL('../data/cookie-preferences.json', document.currentScript.src);
    let preferences = {};
    let allCategories = false;
    let config;
    let stored = false;
    try {
      const value = localStorage.getItem(key);
      stored = !!value;
      if (value?.startsWith('{')) {
        const saved = JSON.parse(value);
        preferences = saved.categories || {};
        allCategories = saved.choice === 'all';
      } else allCategories = value === 'all';
    } catch { /* Preference persistence is optional. */ }
    if (!stored) {
      if (document.documentElement.hasAttribute('data-demo-locked')) {
        document.addEventListener('demo-unlocked', () => cookie.showModal(), { once: true });
      } else cookie.showModal();
    }
    async function settings() {
      const options = cookie.querySelector('[data-cookie-options]');
      options.hidden = false;
      options.textContent = swedish ? 'Laddar inställningar…' : 'Loading settings…';
      try {
        config ||= await fetch(configUrl, { signal: AbortSignal.timeout(10000) }).then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        });
        const source = config[document.documentElement.lang] || config.en;
        options.replaceChildren();
        const heading = document.createElement('h3');
        heading.className = 'h5';
        heading.textContent = source.cookie_banner_subtitle;
        options.append(heading);
        for (const category of source.cookie_categories || []) {
          const group = document.createElement('div');
          group.className = 'form-check my-4';
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.className = 'form-check-input';
          input.dataset.cookieCategory = category.id;
          input.id = `demo-cookie-${category.id}`;
          input.checked = allCategories || !!preferences[category.id];
          const label = document.createElement('label');
          label.className = 'form-check-label';
          label.htmlFor = input.id;
          label.textContent = category.title;
          const detail = document.createElement('p');
          detail.textContent = category.text;
          group.append(input, label, detail);
          options.append(group);
        }
        const save = document.createElement('button');
        save.type = 'button';
        save.className = 'btn btn-primary';
        save.dataset.cookieChoice = 'necessary';
        save.textContent = source.cookie_banner_accept_choices_text;
        options.append(save);
      } catch (error) {
        options.textContent = `${swedish ? 'Inställningarna kunde inte laddas. Försök igen.' : 'Settings could not load. Please try again.'} (${error.message})`;
      }
    }
    document.addEventListener('click', event => {
      const choice = event.target.closest('[data-cookie-choice]');
      if (choice) {
        const categories = {};
        cookie.querySelectorAll('[data-cookie-category]').forEach(input => {
          categories[input.dataset.cookieCategory] = choice.dataset.cookieChoice === 'all' || (choice.dataset.cookieChoice === 'necessary' && input.checked);
        });
        preferences = categories;
        allCategories = choice.dataset.cookieChoice === 'all';
        try { localStorage.setItem(key, JSON.stringify({ choice: choice.dataset.cookieChoice, categories })); } catch { /* No submitted data is saved. */ }
        cookie.close();
      }
      if (event.target.closest('[data-cookie-settings]')) settings();
      if (event.target.closest('footer button') && /cookie/i.test(event.target.textContent)) cookie.showModal();
    });
    fetch(configUrl, { signal: AbortSignal.timeout(10000) }).then(response => response.ok ? response.json() : null).then(value => {
      if (!value) return;
      config = value;
      const source = value[document.documentElement.lang] || value.en;
      for (const [selector, field] of [['[data-cookie-choice="all"]', 'cookie_banner_accept_text'], ['[data-cookie-choice="none"]', 'cookie_banner_accept_none_text'], ['[data-cookie-settings]', 'cookie_banner_manage_text']]) {
        const button = cookie.querySelector(selector);
        if (button && source[field]) button.textContent = source[field];
      }
    }).catch(() => { /* Explicit settings retries and displays any loading error. */ });
  }
  const archiveScript = document.createElement('script');
  archiveScript.src = new URL('./archive.js', document.currentScript.src).href;
  archiveScript.defer = true;
  document.body.append(archiveScript);
})();
