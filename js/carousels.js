/* Original image galleries and compact mobile statistics, without React. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.carousel').forEach(carousel => {
    const slides = [...carousel.querySelectorAll('.carousel-inner > .carousel-item')];
    if (slides.length < 2) return;
    const hero = !!carousel.closest('.hero');
    let selected = Math.max(0, slides.findIndex(slide => slide.classList.contains('active')));
    const indicators = [...carousel.querySelectorAll('.carousel-indicators button')];
    function show(index) {
      selected = (index + slides.length) % slides.length;
      slides.forEach((slide, current) => {
        slide.classList.toggle('active', current === selected);
        if (!hero) slide.setAttribute('aria-hidden', String(current !== selected));
      });
      indicators.forEach((button, current) => {
        button.classList.toggle('active', current === selected);
        button.setAttribute('aria-current', String(current === selected));
      });
    }
    indicators.forEach((button, index) => button.addEventListener('click', () => show(index)));
    carousel.querySelectorAll('.carousel-control-prev,[data-bs-slide="prev"]').forEach(button => button.addEventListener('click', () => show(selected - 1)));
    carousel.querySelectorAll('.carousel-control-next,[data-bs-slide="next"]').forEach(button => button.addEventListener('click', () => show(selected + 1)));
    let paused = false;
    carousel.addEventListener('mouseenter', () => { paused = true; });
    carousel.addEventListener('mouseleave', () => { paused = false; });
    carousel.addEventListener('focusin', () => { paused = true; });
    carousel.addEventListener('focusout', () => { paused = false; });
    let startX = null;
    carousel.addEventListener('touchstart', event => { startX = event.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', event => {
      if (startX === null) return;
      const distance = event.changedTouches[0].clientX - startX;
      if (Math.abs(distance) > 50) show(selected + (distance < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });
    setInterval(() => {
      if (!paused && !reduced.matches && !document.hidden && (!hero || innerWidth < 768)) show(selected + 1);
    }, 5000);
    show(selected);
  });
  document.addEventListener('keydown', event => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
    let index = tabs.indexOf(tab);
    index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    event.preventDefault();
    tabs[index]?.focus();
    tabs[index]?.click();
  });
})();
