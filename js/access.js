/* A deliberately simple, client-side demo gate; not server authentication. */
(() => {
  'use strict';
  const storageKey = 'polymai:consid_demo:access';
  const root = document.documentElement;
  let unlocked = false;
  try { unlocked = sessionStorage.getItem(storageKey) === 'granted'; } catch {}
  if (unlocked) root.removeAttribute('data-demo-locked');

  function reveal() {
    unlocked = true;
    try { sessionStorage.setItem(storageKey, 'granted'); } catch {}
    root.removeAttribute('data-demo-locked');
    document.querySelector('#demo-access input').value = '';
    document.querySelector('main')?.setAttribute('tabindex', '-1');
    document.querySelector('main')?.focus({ preventScroll: true });
    document.dispatchEvent(new Event('demo-unlocked'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#demo-access form');
    if (!form) return;
    const input = form.querySelector('input');
    input.setAttribute('aria-label', 'Lösenord');
    const error = form.querySelector('[role="alert"]');
    form.addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (input.value === 'ConsidAI') reveal();
      else {
        error.hidden = false;
        input.setAttribute('aria-invalid', 'true');
        input.select();
      }
    });
    input.addEventListener('input', () => {
      error.hidden = true;
      input.removeAttribute('aria-invalid');
    });
    if (!unlocked) input.focus({ preventScroll: true });
    // Do not download videos before access or while they are off screen.
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting || !unlocked) continue;
        const video = entry.target;
        for (const element of [video, ...video.querySelectorAll('source')]) {
          if (element.dataset.demoSrc) {
            element.src = element.dataset.demoSrc;
            delete element.dataset.demoSrc;
          }
        }
        video.load();
        if (video.hasAttribute('autoplay') && !matchMedia('(prefers-reduced-motion: reduce)').matches) video.play().catch(() => {});
        observer.unobserve(video);
      }
    }, { rootMargin: '100px' });
    const observe = () => document.querySelectorAll('video[data-demo-src], video:has(source[data-demo-src])').forEach(video => observer.observe(video));
    if (unlocked) observe();
    else document.addEventListener('demo-unlocked', observe, { once: true });
    document.addEventListener('demo-page-ready', observe);
  });
})();
