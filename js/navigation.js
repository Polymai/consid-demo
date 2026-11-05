/* Shared navigation owns desktop menus, mobile drawer, focus and theme. */
(() => {
  'use strict';
  const dialog = document.getElementById('demo-menu-dialog');
  if (!dialog) return;
  const backdrop = document.getElementById('demo-menu-backdrop');
  const content = dialog.querySelector('[data-menu-content]');
  const nav = document.querySelector('.navbar');
  const toggle = nav?.querySelector('.navbar-toggler');
  const menuLabel = toggle?.getAttribute('aria-label') || 'Menu';
  let active = null;
  let opener = null;
  const mobile = () => matchMedia('(max-width: 991.98px)').matches;
  const visible = element => !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
  function expanded() {
    nav?.querySelectorAll('button[data-rr-ui-event-key]').forEach(button => {
      button.setAttribute('aria-expanded', String(active === button.dataset.rrUiEventKey));
      button.setAttribute('aria-controls', 'demo-menu-dialog');
    });
    toggle?.setAttribute('aria-expanded', String(!!active));
    if (toggle) {
      toggle.setAttribute('aria-label', active ? (document.documentElement.lang === 'sv' ? 'Stäng' : 'Close') : menuLabel);
      toggle.setAttribute('aria-controls', 'demo-menu-dialog');
      const icon = toggle.querySelector('i');
      if (icon) icon.className = `fa-regular ${active ? 'fa-xmark' : 'fa-bars'} me-1`;
      const label = toggle.querySelector('b');
      if (label) label.textContent = active ? (document.documentElement.lang === 'sv' ? 'Stäng' : 'Close') : (document.documentElement.lang === 'sv' ? 'Meny' : 'Menu');
    }
  }
  function close(restore = true) {
    dialog.hidden = true;
    backdrop.hidden = true;
    dialog.classList.remove('show');
    backdrop.classList.remove('show');
    nav?.classList.remove('menu-open');
    document.body.classList.remove('demo-menu-open');
    document.querySelector('main')?.removeAttribute('inert');
    document.querySelector('footer')?.removeAttribute('inert');
    active = null;
    expanded();
    if (restore) opener?.focus();
  }
  function open(key, source) {
    if (active === key && key !== 'root') return close();
    if (!active) opener = source || document.activeElement;
    content.replaceChildren();
    if (key === 'root') {
      const original = document.getElementById('offcanvasNavbar');
      const clone = original?.cloneNode(true);
      if (!clone) return;
      clone.removeAttribute('id');
      clone.className = 'demo-mobile-root';
      clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      content.append(clone);
    } else {
      const template = document.getElementById(`demo-menu-${key}`);
      if (!template) return;
      content.append(template.content.cloneNode(true));
    }
    active = key;
    dialog.classList.toggle('action-offcanvas', key === 'search' || key === 'language');
    dialog.classList.toggle('menu-offcanvas', key !== 'search' && key !== 'language');
    dialog.hidden = false;
    backdrop.hidden = false;
    dialog.style.visibility = 'visible';
    dialog.classList.add('show');
    backdrop.classList.add('show');
    nav?.classList.add('menu-open');
    document.body.classList.add('demo-menu-open');
    document.querySelector('main')?.setAttribute('inert', '');
    document.querySelector('footer')?.setAttribute('inert', '');
    expanded();
    const focus = key === 'search' ? content.querySelector('input') : content.querySelector('button,a[href]');
    (focus || dialog).focus();
    document.dispatchEvent(new CustomEvent('demo:menu-open', { detail: key }));
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('button,a');
    if (!target) return;
    const key = target.dataset.rrUiEventKey;
    if (target.matches('[data-menu-close]')) close();
    else if (target.matches('[data-menu-back]')) open('root', toggle);
    else if (target.matches('.navbar-toggler')) active ? close() : open('root', target);
    else if (key && target.tagName === 'BUTTON' && target.closest('.navbar,#demo-menu-dialog')) open(key, target);
    else if (target.querySelector('.fa-search') && target.closest('.navbar,#demo-menu-dialog')) open('search', target);
    else if (target.querySelector('.fa-language') && target.closest('.navbar,#demo-menu-dialog')) open('language', target);
    else if (target.matches('a') && target.closest('#demo-menu-dialog')) close(false);
  });
  backdrop.addEventListener('click', () => close());
  document.addEventListener('keydown', event => {
    if (!active) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
    if (event.key === 'Tab') {
      const controls = [...nav.querySelectorAll('button,a[href]'), ...dialog.querySelectorAll('button,a[href],input,select,textarea')].filter(el => visible(el) && !el.disabled);
      const index = controls.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1)?.focus(); }
      else if (!event.shiftKey && index === controls.length - 1) { event.preventDefault(); controls[0]?.focus(); }
    }
  });
  matchMedia('(min-width: 992px)').addEventListener('change', () => close(false));
  const storageKey = 'polymai:consid_demo:theme';
  function theme(value) {
    document.documentElement.classList.toggle('light', value === 'light');
    document.documentElement.classList.toggle('dark', value === 'dark');
    document.documentElement.dataset.bsTheme = value;
    document.body.dataset.bsTheme = value;
    if (nav) nav.dataset.bsTheme = value;
    dialog.dataset.bsTheme = value;
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-label', `Switch to ${value === 'dark' ? 'light' : 'dark'} mode`);
      button.firstElementChild.textContent = value === 'dark' ? '☀' : '☾';
    });
  }
  try { theme(localStorage.getItem(storageKey) || 'light'); } catch { theme('light'); }
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-theme-toggle]')) return;
    const value = document.documentElement.dataset.bsTheme === 'dark' ? 'light' : 'dark';
    theme(value);
    try { localStorage.setItem(storageKey, value); } catch { /* Storage is optional. */ }
  });
  expanded();
  let scrollPending = false;
  const syncScroll = () => { nav?.classList.toggle('scrolled', window.scrollY > 24); scrollPending = false; };
  window.addEventListener('scroll', () => {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(syncScroll); }
  }, { passive: true });
  window.addEventListener('pageshow', syncScroll);
  syncScroll();
})();
