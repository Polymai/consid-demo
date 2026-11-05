/* Assemble one page from reusable templates after demo access is granted. */
(() => {
  'use strict';
  const html = document.documentElement;
  const appRoot = new URL(document.body.dataset.appRoot || './', location.href);
  const source = new URL(html.dataset.demoContent, location.href);
  const status = document.getElementById('demo-page-status');
  const message = status.querySelector('[data-page-message]');
  const retry = status.querySelector('button');
  let running = false;
  let mounted = false;
  const loadedScripts = new Set();
  const materialize = text => text.replaceAll('__DEMO_ROOT__/', appRoot.href);

  async function compressed(url, type) {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Page HTTP ${response.status}`);
    // Some static hosts transparently decode .gz responses; support both forms.
    const bytes = new Uint8Array(await response.arrayBuffer());
    const text = bytes[0] === 0x1f && bytes[1] === 0x8b
      ? await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
      : new TextDecoder().decode(bytes);
    return type === 'json' ? JSON.parse(text) : text;
  }
  async function stylesheet(node) {
    const href = node.getAttribute('href');
    if ([...document.querySelectorAll('link[rel="stylesheet"]')].some(link => link.href === new URL(href, location.href).href)) return;
    await new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = href;
      link.onload = resolve;
      link.onerror = () => { link.remove(); reject(new Error('Stylesheet unavailable')); };
      document.head.append(link);
    });
  }
  async function script(src) {
    const url = materialize(src);
    if (loadedScripts.has(url)) return;
    await new Promise((resolve, reject) => {
      const node = document.createElement('script');
      node.src = url; node.async = false;
      node.onload = resolve; node.onerror = () => reject(new Error('Page script unavailable'));
      document.body.append(node);
    });
    loadedScripts.add(url);
  }
  async function load() {
    if (running || html.hasAttribute('data-demo-ready') || html.hasAttribute('data-demo-locked')) return;
    running = true;
    status.hidden = false; status.setAttribute('aria-busy', 'true');
    message.textContent = 'Laddar sidan…'; retry.hidden = true;
    try {
      const data = await compressed(source, 'json');
      const fragments = await Promise.all(data.templates.map(async key => [key, await compressed(new URL(`data/templates/${key.slice(0, 2)}/${key}.html.gz`, appRoot), 'text')]));
      let body = data.body;
      for (const [key, value] of fragments) body = body.replaceAll(`<template data-demo-include="${key}"></template>`, value);
      const head = new DOMParser().parseFromString(materialize(data.head), 'text/html');
      await Promise.all([...head.querySelectorAll('link[rel="stylesheet"]')].map(stylesheet));
      for (const [name, value] of Object.entries(data.bodyAttrs)) document.body.setAttribute(name, materialize(value));
      for (const [name, value] of Object.entries(data.htmlAttrs)) {
        if (!['data-demo-locked', 'data-demo-content'].includes(name)) html.setAttribute(name, value);
      }
      if (!mounted) {
        const template = document.createElement('template');
        template.innerHTML = materialize(body);
        document.body.insertBefore(template.content, status);
        mounted = true;
      }
      // The original local modules bind only after their DOM has been assembled.
      for (const src of data.scripts) await script(src);
      html.setAttribute('data-demo-ready', '');
      status.hidden = true; status.setAttribute('aria-busy', 'false');
      document.dispatchEvent(new Event('demo-page-ready'));
      if (location.hash) {
        try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(); } catch {}
      }
    } catch (error) {
      message.textContent = 'Sidan kunde inte laddas. Försök igen.';
      status.setAttribute('aria-busy', 'false'); retry.hidden = false;
      console.error('Demo page load:', error);
    } finally { running = false; }
  }
  retry.addEventListener('click', () => mounted ? location.reload() : load());
  document.addEventListener('demo-unlocked', load);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true });
  else load();
})();
