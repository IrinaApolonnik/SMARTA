'use strict';

// Сейчас доступны только три статьи из макета
const loadMoreButton = document.querySelector('#load-more');
const loadStatus = document.querySelector('#load-status');
if (loadMoreButton && loadStatus) {
  loadMoreButton.addEventListener('click', () => {
    loadStatus.hidden = false;
    loadStatus.textContent = 'Показаны все доступные статьи.';
  });
}
