/* No form data leaves the browser or enters persistent storage. */
(() => {
  'use strict';
  const swedish = document.documentElement.lang === 'sv';
  function prepare(form) {
    form.querySelectorAll('button[type="submit"]').forEach(button => { button.disabled = false; });
    form.querySelectorAll('textarea').forEach(field => {
      field.addEventListener('input', () => {
        const counter = form.querySelector('[id$="commentCounter"]');
        if (counter) counter.textContent = `${field.value.length} / ${field.maxLength || 250}`;
      });
    });
    form.addEventListener('reset', () => {
      const status = form.querySelector('.demo-form-status');
      if (status) { status.hidden = true; status.textContent = ''; }
      form.querySelectorAll('.demo-download').forEach(link => { link.hidden = true; });
      setTimeout(() => form.querySelector('textarea')?.dispatchEvent(new Event('input')), 0);
    });
  }
  document.querySelectorAll('[data-demo-form]').forEach(prepare);
  document.addEventListener('submit', event => {
    const form = event.target;
    // Search owns its own local handler. All other submissions stop here.
    if (form.matches('[data-local-search], [data-access-form]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    form.querySelectorAll('input[required]').forEach(field => {
      if (!['checkbox', 'file', 'hidden'].includes(field.type) && !field.value.trim()) {
        field.setCustomValidity(swedish ? 'Fyll i det här fältet.' : 'Please fill out this field.');
        field.addEventListener('input', () => field.setCustomValidity(''), { once: true });
      }
    });
    const phone = form.querySelector('input[name="phone"]');
    if (phone?.value && !/^\+?[0-9\s().-]{6,25}$/.test(phone.value.trim())) {
      phone.setCustomValidity(swedish ? 'Ange ett giltigt telefonnummer.' : 'Please enter a valid phone number.');
      phone.addEventListener('input', () => phone.setCustomValidity(''), { once: true });
    }
    if (!form.reportValidity()) return;
    const area = form.querySelector('select[name="area"]');
    if (area && area.value === 'default') {
      area.setCustomValidity(swedish ? 'Välj ett område.' : 'Please select an area.');
      area.reportValidity();
      area.addEventListener('change', () => area.setCustomValidity(''), { once: true });
      return;
    }
    const message = swedish ? 'Tack! Detta var ett demoinskick. Inga uppgifter har skickats eller sparats.' : 'Thank you! This was a demo submission. No details were sent or saved.';
    let status = form.querySelector('.demo-form-status');
    if (!status) {
      status = document.createElement('p');
      status.className = 'demo-form-status';
      status.setAttribute('role', 'status');
      status.tabIndex = -1;
      form.append(status);
    }
    form.reset();
    status.hidden = false;
    status.textContent = message;
    form.querySelectorAll('.demo-download').forEach(link => { link.hidden = false; });
    status.focus();
  }, true);
  // External application/registration services must also remain in demo mode.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    const formHost = /(^|\.)(teamtailor\.com|jobylon\.com|varbi\.com|typeform\.com|forms\.office\.com|forms\.gle)$/.test(url.hostname) || (url.hostname === 'docs.google.com' && url.pathname.startsWith('/forms/'));
    const formPath = /\/(apply|register|signup|application|anmalan|ansok)(\/|$)/i.test(url.pathname);
    if (url.origin === location.origin || (!formHost && !formPath)) return;
    event.preventDefault();
    const modal = document.createElement('dialog');
    modal.className = 'demo-cookie';
    const text = document.createElement('p');
    text.textContent = swedish ? 'Demoläge – ansökan eller anmälan skickas inte.' : 'Demo mode – applications and registrations are not submitted.';
    const button = document.createElement('button');
    button.className = 'btn btn-primary';
    button.textContent = swedish ? 'Stäng' : 'Close';
    button.onclick = () => { modal.close(); modal.remove(); };
    modal.append(text, button);
    document.body.append(modal);
    modal.showModal();
  });
})();
