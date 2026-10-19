'use strict';

// Раскрытие содержания и подсветка текущего раздела при прокрутке.
(() => {
  const toggle = document.querySelector('.toc-toggle');
  toggle?.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true'));
  });
  const links = [...document.querySelectorAll('.toc-item')];
  const sections = links.map((link) => document.querySelector(link.getAttribute('href')));
  if (!links.length) return;
  let pending = false;
  let active = -1;
  function sync() {
    pending = false;
    let current = 0;
    const line = Math.min(180, window.innerHeight / 3);
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= line) current = index;
    });
    if (current === active) return;
    active = current;
    links.forEach((link, index) => {
      link.classList.toggle('active', index === current);
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function schedule() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(sync);
    }
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  sync();
})();
