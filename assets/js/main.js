'use strict';

// Сейчас доступны только три статьи из макета. Ничего не дублируем и не имитируем запрос.
// При интеграции CMS заменит этот обработчик загрузкой следующей страницы статей.
const loadMoreButton = document.querySelector('#load-more');
const loadStatus = document.querySelector('#load-status');
if (loadMoreButton && loadStatus) {
  loadMoreButton.addEventListener('click', () => {
    loadStatus.hidden = false;
    loadStatus.textContent = 'Показаны все доступные статьи.';
  });
}
