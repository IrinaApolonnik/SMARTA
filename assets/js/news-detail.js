'use strict';

// Общие действия детальных страниц: галерея, копирование, публикация ссылки и демо-каталог.
(() => {
  const dialog = document.querySelector('.gallery-dialog');
  if (dialog) {
    document
      .querySelectorAll('[data-gallery]')
      .forEach((button) => button.addEventListener('click', () => dialog.showModal()));
    dialog.querySelector('.gallery-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          dialog.close();
      }
    });
  }
  function notify(id, text) {
    const status = document.getElementById(id);
    status.hidden = false;
    status.textContent = text;
  }
  async function copy(text, statusId, message) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const field = document.createElement('textarea');
        field.value = text;
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.append(field);
        field.select();
        const success = document.execCommand('copy');
        field.remove();
        if (!success) throw new Error('Clipboard unavailable');
      }
      notify(statusId, message);
    } catch {
      notify(statusId, 'Не удалось скопировать автоматически. Скопируйте вручную: ' + text);
    }
  }
  document
    .getElementById('share-copy')
    .addEventListener('click', () => copy(location.href, 'share-status', 'Ссылка скопирована.'));
  document
    .querySelectorAll('[data-copy]')
    .forEach((button) =>
      button.addEventListener('click', () =>
        copy(button.dataset.copy, 'product-status', 'Номер заказа скопирован.'),
      ),
    );
  const publicPage =
    /^https?:$/.test(location.protocol) &&
    !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const url = encodeURIComponent(location.href);
  document.querySelectorAll('[data-share]').forEach((link) => {
    link.href =
      link.dataset.share === 'vk'
        ? `https://vk.com/share.php?url=${url}`
        : `https://t.me/share/url?url=${url}&text=${encodeURIComponent(document.title)}`;
    if (!publicPage)
      link.addEventListener('click', (event) => {
        event.preventDefault();
        notify(
          'share-status',
          'Поделиться можно после публикации: сейчас страница открыта локально.',
        );
      });
  });
  const demoCart = new Map();
  document.querySelectorAll('[data-demo-cart]').forEach((button) =>
    button.addEventListener('click', () => {
      const id = button.dataset.demoCart;
      const quantity = (demoCart.get(id) || 0) + 1;
      demoCart.set(id, quantity);
      button.textContent = `Добавлено: ${quantity}`;
      notify(
        'product-status',
        `Тестовая корзина: товар ${id}, ${quantity} шт. Заказ не отправляется.`,
      );
    }),
  );
  document
    .querySelectorAll('[data-demo-info]')
    .forEach((button) =>
      button.addEventListener('click', () => notify('product-status', button.dataset.demoInfo)),
    );
})();
