'use strict';

// Общий список: фильтр по URL, карточки, подгрузка и активная страница при прокрутке

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
  // Пустые необязательные поля пропускаем; без заголовка и ссылки карточку не показываются.
  const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== '';
  const getTags = (item) => (Array.isArray(item.tags) ? item.tags.filter(hasValue) : []);
  const records = source.filter(
    (item) =>
      item &&
      hasValue(item.title) &&
      (hasValue(item.id) || hasValue(item.href)) &&
      (!tag || getTags(item).includes(tag)),
  );
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
    String(value ?? '')
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
  // Разметка одной карточки для фильтрации и кнопки «Загрузить ещё»
  function card(item, index) {
    const detailUrl =
      item.href ||
      `${isArticles ? 'article' : 'news'}-detail.html?id=${encodeURIComponent(item.id)}`;
    const readingTime =
      hasValue(item.minutes) && Number.isFinite(Number(item.minutes)) && Number(item.minutes) > 0
        ? ` &nbsp;/&nbsp; ${escape(item.minutes)} мин чтения`
        : '';
    const tags = getTags(item);
    const tagsHtml = tags.length
      ? `<div class="media-tags">${tags.map((value) => `<a href="${escape(url(1, value))}">#${escape(value)}</a>`).join('')}</div>`
      : '';
    const dateHtml = hasValue(item.date)
      ? `<time${hasValue(item.iso) ? ` datetime="${escape(item.iso)}"` : ''}>${escape(item.date)}</time>`
      : '';
    const imageHtml = hasValue(item.image)
      ? `<div class="card-media">
          <img src="${escape(item.image.startsWith('assets/') ? item.image : 'assets/images/' + item.image)}"
            width="387" height="220" alt="${escape(item.alt)}" decoding="async"
            ${index > 0 ? 'loading="lazy"' : 'fetchpriority="high"'}>
        </div>`
      : '';
    return `<article class="card">
      ${imageHtml}
      <div class="card-body">
        <div class="card-content">
          <div class="card-head">
            <p class="media-card-meta">${isArticles ? 'Статья' : 'Новость'}${readingTime}</p>
            <h2 class="media-card-title">
              <a class="media-card-link" href="${escape(detailUrl)}">${escape(item.title)}</a>
            </h2>
          </div>
          ${tagsHtml || dateHtml ? `<div class="card-footer">${tagsHtml}${dateHtml}</div>` : ''}
        </div>
      </div>
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
  // Раздел становится текущим, когда его начало проходит середину окна
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
