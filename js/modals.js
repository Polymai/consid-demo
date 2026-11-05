/* Native dialogs provide focus trapping, Escape and a local-only form boundary. */
(() => {
  document.addEventListener('click', event => {
    const open = event.target.closest('[data-open-dialog]');
    if (open) {
      const modal = document.getElementById(open.dataset.openDialog);
      if (modal && !modal.open) { modal.showModal(); document.body.classList.add('demo-dialog-open'); }
    }
    const close = event.target.closest('[data-dialog-close]');
    if (close) close.closest('dialog').close();
    const download = event.target.closest('main button');
    if (download && /^(ladda ner|download|last ned|hent)/i.test(download.textContent.trim())) {
      const form = document.querySelector('main form[data-demo-form]');
      form?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      setTimeout(() => form?.querySelector('input,select')?.focus({ preventScroll: true }), 350);
    }
  });
  document.querySelectorAll('.demo-fullscreen').forEach(modal => {
    modal.addEventListener('close', () => { modal.querySelector('form')?.reset(); document.body.classList.remove('demo-dialog-open'); });
  });
})();
