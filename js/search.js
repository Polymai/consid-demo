/* Original search interface, backed exclusively by captured local page text. */
(() => {
  'use strict';
  const root = new URL(document.body.dataset.appRoot || './', location.href);
  const indexUrl = new URL(`../data/search/${document.documentElement.lang}.json.gz`, document.currentScript.src);
  const swedish = document.documentElement.lang === 'sv';
  let indexPromise;
  function index() {
    if (!indexPromise) indexPromise = fetch(indexUrl, { signal: AbortSignal.timeout(20000) }).then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.arrayBuffer().then(async buffer => {
        const bytes = new Uint8Array(buffer);
        const text = bytes[0] === 0x1f && bytes[1] === 0x8b
          ? await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
          : new TextDecoder().decode(bytes);
        return JSON.parse(text);
      });
    }).catch(error => { indexPromise = null; throw error; });
    return indexPromise;
  }
  function destination(route) {
    return new URL(route.replace(/^\//, '') + 'index.html', root).href;
  }
  async function search(form) {
    let results = form.parentElement.querySelector('[data-search-results]');
    if (!results) {
      results = document.createElement('div');
      results.dataset.searchResults = '';
      results.setAttribute('aria-live', 'polite');
      results.className = 'py-5';
      form.after(results);
    }
    const query = form.querySelector('input[type="search"],input[name="search"]')?.value.trim() || '';
    if (!query) { results.textContent = swedish ? 'Skriv något att söka efter.' : 'Enter a search term.'; return; }
    results.textContent = swedish ? 'Söker…' : 'Searching…';
    results.setAttribute('aria-busy', 'true');
    try {
      const terms = query.toLocaleLowerCase().split(/\s+/);
      const records = await index();
      const matches = records.filter(item => item.language === document.documentElement.lang && terms.every(term => `${item.title} ${item.text}`.toLocaleLowerCase().includes(term))).sort((a, b) => Number(b.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())) - Number(a.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())));
      results.replaceChildren();
      const count = document.createElement('p');
      count.textContent = matches.length ? `${matches.length} ${swedish ? 'träffar' : 'results'}` : (swedish ? 'Inga träffar. Prova ett annat sökord.' : 'No results. Try another search term.');
      results.append(count);
      for (const item of matches) {
        const article = document.createElement('article');
        article.className = 'demo-search-result';
        const link = document.createElement('a');
        link.href = destination(item.url);
        link.textContent = item.title.replace(/\s+-\s+Consid$/, '');
        const text = document.createElement('p');
        const start = Math.max(0, item.text.toLocaleLowerCase().indexOf(terms[0]) - 70);
        text.textContent = item.text.slice(start, start + 220) + '…';
        article.append(link, text);
        results.append(article);
      }
    } catch (error) {
      results.textContent = `${swedish ? 'Sökningen kunde inte laddas. Försök igen.' : 'Search could not load. Please try again.'} (${error.message})`;
    } finally { results.removeAttribute('aria-busy'); }
  }
  document.addEventListener('submit', event => {
    if (!event.target.matches('[data-local-search]')) return;
    event.preventDefault();
    search(event.target);
  });
  const pageForm = document.querySelector('main form[data-local-search]');
  if (pageForm) {
    const query = new URL(location.href).searchParams.get('q') || new URL(location.href).searchParams.get('s');
    if (query) { pageForm.querySelector('input').value = query; search(pageForm); }
  }
})();
