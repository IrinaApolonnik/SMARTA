'use strict';

// Общий список: фильтр по URL, карточки, подгрузка и активная страница при прокрутке.

(() => {
  const isArticles = Boolean(document.querySelector('.media-articles'));
  const prefix = isArticles ? 'articles' : 'news';
  const source = isArticles ? window.SMARTA_ARTICLES : window.SMARTA_NEWS;
  const completeMessage = isArticles
    ? 'Показаны все доступные статьи.'
    : 'Показаны все доступные новости.';
  const forms = isArticles ? ['статья', 'статьи', 'статей'] : ['новость', 'новости', 'новостей'];
  const grid = document.querySelector('#' + prefix + '-grid');
  if (!grid || !Array.isArray(source)) return;
  const pageSize = 6;
  const params = new URLSearchParams(location.search);
  const tag = params.get('tag') || '';
  const records = source.filter((item) => !tag || item.tags.includes(tag));
  const pageCount = Math.ceil(records.length / pageSize);
  const requestedPage = Number(params.get('page'));
  const page = Math.min(
    Math.max(Number.isInteger(requestedPage) ? requestedPage : 1, 1),
    pageCount || 1,
  );
  let shownUntil = Math.min(page * pageSize, records.length);
  const start = (page - 1) * pageSize;
  let activePage = page;
  const button = document.querySelector('#' + prefix + '-load-more');
  const status = document.querySelector('#' + prefix + '-status');
  const pagination = document.querySelector('#' + prefix + '-pagination');
  const escape = (value) =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  function url(targetPage = 1, targetTag = tag) {
    const query = new URLSearchParams();
    if (targetTag) query.set('tag', targetTag);
    if (targetPage > 1) query.set('page', targetPage);
    return prefix + '.html' + (query.size ? '?' + query : '');
  }
  function card(item, index) {
    return `<article class="card">
      <div class="card-media"><img src="assets/images/${escape(item.image)}" width="387" height="220" alt="${escape(item.alt)}" decoding="async"${index >= 3 ? ' loading="lazy"' : ''}></div>
      <div class="card-body"><div class="card-content">
        <div class="card-head"><p class="media-card-meta">${isArticles ? 'Статья' : 'Новость'} &nbsp; / &nbsp; ${item.minutes} мин чтения</p><h2 class="media-card-title"><a class="media-card-link" href="${isArticles ? 'article-detail' : 'news-detail'}.html?id=${encodeURIComponent(item.id)}">${escape(item.title)}</a></h2></div>
        <div class="card-footer"><div class="media-tags">${item.tags.map((value) => `<a href="${escape(url(1, value))}">#${escape(value)}</a>`).join('')}</div><time datetime="${escape(item.iso)}">${escape(item.date)}</time></div>
      </div></div>
    </article>`;
  }
  function countWord(count) {
    const tens = count % 100;
    if (tens >= 11 && tens <= 14) return forms[2];
    if (count % 10 === 1) return forms[0];
    return count % 10 >= 2 && count % 10 <= 4 ? forms[1] : forms[2];
  }
  document.querySelector('#' + prefix + '-count').textContent =
    `${records.length} ${countWord(records.length)}`;
  document.querySelector('#reset-filter').hidden = !tag;
  document.querySelectorAll('[data-list-tag]').forEach((link) => {
    if (link.dataset.listTag === tag) link.setAttribute('aria-current', 'true');
  });
  grid.innerHTML = records.slice(start, shownUntil).map(card).join('');
  function updatePagination() {
    const pages = new Set([1, pageCount, activePage - 1, activePage, activePage + 1]);
    if (activePage <= 2) pages.add(3);
    if (activePage >= pageCount - 1) pages.add(pageCount - 2);
    let previous = 0;
    pagination.innerHTML = [...pages]
      .filter((n) => n >= 1 && n <= pageCount)
      .sort((a, b) => a - b)
      .map((n) => {
        const dots =
          previous && n - previous > 1
            ? '<span class="pagination-dots" aria-hidden="true">...</span>'
            : '';
        previous = n;
        return `${dots}<a class="pagination-item${n === activePage ? ' active' : ''}" href="${escape(url(n))}" aria-label="Страница ${n}"${n === activePage ? ' aria-current="page"' : ''}>${n}</a>`;
      })
      .join('');
    pagination.hidden = pageCount <= 1;
  }
  updatePagination();
  // Порция становится текущей, когда её начало проходит середину окна.
  // Проверяем только первую карточку каждой шестёрки; сетка остаётся прежней.
  function syncVisiblePage() {
    const cards = grid.children;
    let visiblePage = page;
    for (let index = 0; index < cards.length; index += pageSize) {
      if (cards[index].getBoundingClientRect().top <= window.innerHeight / 2) {
        visiblePage = page + index / pageSize;
      } else break;
    }
    if (visiblePage !== activePage) {
      activePage = visiblePage;
      updatePagination();
    }
  }
  let scrollFrame = 0;
  function schedulePageSync() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      syncVisiblePage();
    });
  }
  window.addEventListener('scroll', schedulePageSync, { passive: true });
  window.addEventListener('resize', schedulePageSync);
  window.addEventListener('pageshow', schedulePageSync);
  schedulePageSync();
  if (!records.length) {
    status.hidden = false;
    status.textContent = isArticles
      ? 'По этому хэштегу статьи не найдены.'
      : 'По этому хэштегу новости не найдены.';
    button.hidden = true;
  }
  button.addEventListener('click', () => {
    if (shownUntil >= records.length) {
      status.hidden = false;
      status.textContent = completeMessage;
      return;
    }
    const next = records.slice(shownUntil, shownUntil + pageSize);
    grid.insertAdjacentHTML(
      'beforeend',
      next.map((item, index) => card(item, shownUntil - start + index)).join(''),
    );
    shownUntil += next.length;
    schedulePageSync();
    status.hidden = false;
    status.textContent =
      shownUntil >= records.length
        ? completeMessage
        : `Показано ${shownUntil - start} из ${records.length} ${forms[2]}.`;
  });
})();
